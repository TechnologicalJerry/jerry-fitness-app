import { mediaRepository } from '../repositories/media.repository';
import { storageManager } from '../storage/storage.manager';
import { mediaValidator } from '../validators/media.validator';
import { mediaDeliveryProvider } from '../processors/delivery-provider';
import { backgroundQueueService } from '../../../jobs/queue.service';
import { logger } from '../../../observability/logger';
import {
  UploadUrlRequestDto,
  UploadUrlResponseDto,
  CompleteUploadDto,
  SignedUrlResponseDto,
  AttachMediaDto,
  MediaVariantName,
  MediaVisibility,
} from '../types/media.types';
import {
  MediaNotFoundError,
  MediaAccessDeniedError,
  StorageQuotaExceededError,
  InvalidMediaStateError,
  QuarantinedMediaError,
} from '../errors/media.errors';

export class MediaService {
  // --- Presigned Upload URL ---
  public async requestUploadUrl(
    userId: string,
    dto: UploadUrlRequestDto,
  ): Promise<UploadUrlResponseDto> {
    const { fileName, contentType, size, mediaType, context, contextId, visibility } = dto;

    // 1. Quota Check
    const quota = await mediaRepository.getUserQuota(userId);
    const availableBytes = quota.maxSizeBytes - quota.usedSizeBytes;
    if (size > availableBytes) {
      throw new StorageQuotaExceededError(userId, size, availableBytes);
    }

    // 2. Validate Request
    mediaValidator.validateUploadRequest(context, mediaType, contentType, size);

    // 3. Sanitize filename and default visibility
    const sanitizedFileName = mediaValidator.sanitizeFileName(fileName);
    let defaultVisibility: MediaVisibility = visibility || 'PRIVATE';
    if (context === 'PROGRESS_PHOTO') {
      defaultVisibility = 'PRIVATE'; // Mandatory private default for progress photos
    } else if (context === 'PROFILE_AVATAR') {
      defaultVisibility = 'PUBLIC';
    }

    // 4. Generate Object Key
    const provider = storageManager.getDefaultProvider();
    const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const objectKey = mediaValidator.generateSecureObjectKey(userId, mediaId, 'original');
    const bucket = 'jerry-fitness-media';

    // 5. Create Metadata Record
    await mediaRepository.createAsset({
      ownerId: userId,
      storageProvider: provider.providerName,
      bucket,
      objectKey,
      originalFileName: sanitizedFileName,
      mimeType: contentType,
      sizeBytes: size,
      mediaType,
      status: 'PENDING',
      visibility: defaultVisibility,
      context,
      contextId,
    });

    // 6. Create Presigned Upload URL
    const expiresInSeconds = 900; // 15 minutes TTL
    const uploadUrl = await provider.createUploadUrl({
      bucket,
      objectKey,
      contentType,
      expiresInSeconds,
    });

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    logger.info({ userId, mediaId, context }, 'Generated presigned upload URL');

    return {
      mediaId,
      uploadUrl,
      expiresAt,
      objectKey,
      bucket,
    };
  }

  // --- Complete Upload ---
  public async completeUpload(
    userId: string,
    mediaId: string,
    dto: CompleteUploadDto,
  ): Promise<any> {
    const asset = await mediaRepository.getAssetById(mediaId);
    if (!asset) {
      throw new MediaNotFoundError(mediaId);
    }

    if (asset.ownerId !== userId) {
      throw new MediaAccessDeniedError();
    }

    if (asset.status !== 'PENDING' && asset.status !== 'UPLOADING') {
      throw new InvalidMediaStateError(asset.status, 'PENDING');
    }

    const provider = storageManager.getProvider(asset.storageProvider);
    const exists = await provider.exists(asset.bucket, asset.objectKey);
    if (!exists) {
      throw new InvalidMediaStateError('FILE_MISSING_IN_STORAGE', 'UPLOADED');
    }

    const updated = await mediaRepository.updateAssetStatus(mediaId, {
      status: 'UPLOADED',
      checksum: dto.checksum,
    });

    // Enqueue background processing asynchronously
    backgroundQueueService.enqueueJob('MEDIA_PROCESSING', { mediaId });

    logger.info({ userId, mediaId }, 'Marked upload complete and enqueued processing');

    return updated;
  }

  // --- Get Media Asset Details & Authorization ---
  public async getMediaAsset(userId: string | undefined, userRole: string | undefined, mediaId: string) {
    const asset = await mediaRepository.getAssetById(mediaId);
    if (!asset) {
      throw new MediaNotFoundError(mediaId);
    }

    this.authorizeAccess(userId, userRole, asset);

    return asset;
  }

  // --- Get Signed Delivery URL ---
  public async getSignedDeliveryUrl(
    userId: string | undefined,
    userRole: string | undefined,
    mediaId: string,
    variantName: MediaVariantName = 'original',
    expiresInSeconds = 3600,
  ): Promise<SignedUrlResponseDto> {
    const asset = await this.getMediaAsset(userId, userRole, mediaId);

    if (asset.status === 'QUARANTINED') {
      throw new QuarantinedMediaError(mediaId);
    }

    let targetObjectKey = asset.objectKey;
    if (variantName !== 'original') {
      const variant = await mediaRepository.getVariant(mediaId, variantName);
      if (variant) {
        targetObjectKey = variant.objectKey;
      }
    }

    const signedDto = await mediaDeliveryProvider.getDeliveryUrl(
      asset.bucket,
      targetObjectKey,
      expiresInSeconds,
      variantName,
      asset.originalFileName,
    );

    // Audit log access asynchronously
    if (userId) {
      mediaRepository
        .logAccess({ mediaId, viewerId: userId, action: 'URL_GENERATED' })
        .catch(() => {});
    }

    return signedDto;
  }

  // --- Delete Asset ---
  public async deleteMediaAsset(userId: string, userRole: string, mediaId: string): Promise<void> {
    const asset = await mediaRepository.getAssetById(mediaId);
    if (!asset) {
      throw new MediaNotFoundError(mediaId);
    }

    if (asset.ownerId !== userId && userRole !== 'ADMIN') {
      throw new MediaAccessDeniedError();
    }

    await mediaRepository.softDeleteAsset(mediaId);
    await mediaRepository.updateUserQuotaUsed(asset.ownerId, -asset.sizeBytes, -1);

    // Trigger cleanup job in background
    backgroundQueueService.enqueueJob('MEDIA_CLEANUP', { mediaId });

    logger.info({ userId, mediaId }, 'Soft deleted media asset');
  }

  // --- Attachments ---
  public async attachMedia(
    userId: string,
    userRole: string,
    mediaId: string,
    dto: AttachMediaDto,
  ) {
    const asset = await this.getMediaAsset(userId, userRole, mediaId);
    if (asset.ownerId !== userId && userRole !== 'ADMIN') {
      throw new MediaAccessDeniedError();
    }

    if (asset.status !== 'READY' && asset.status !== 'UPLOADED') {
      throw new InvalidMediaStateError(asset.status, 'READY');
    }

    return mediaRepository.createAttachment({
      mediaId,
      entityType: dto.entityType,
      entityId: dto.entityId,
      sortOrder: dto.sortOrder,
    });
  }

  public async detachMedia(attachmentId: string): Promise<void> {
    await mediaRepository.deleteAttachment(attachmentId);
  }

  // --- Centralized Access Authorization ---
  private authorizeAccess(
    userId: string | undefined,
    userRole: string | undefined,
    asset: { ownerId: string; visibility: string; context: string | null },
  ): void {
    if (userRole === 'ADMIN') return;
    if (userId && asset.ownerId === userId) return;

    if (asset.context === 'PROGRESS_PHOTO') {
      // Progress photos are strictly private unless explicitly authorized
      throw new MediaAccessDeniedError('Progress photos are private personal content');
    }

    if (asset.visibility === 'PUBLIC' || asset.visibility === 'UNLISTED') {
      return;
    }

    if (asset.visibility === 'TRAINER_ONLY' && userRole === 'TRAINER') {
      return;
    }

    throw new MediaAccessDeniedError();
  }
}

export const mediaService = new MediaService();
