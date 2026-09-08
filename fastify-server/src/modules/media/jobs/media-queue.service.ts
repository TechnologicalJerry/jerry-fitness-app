import { mediaRepository } from '../repositories/media.repository';
import { storageManager } from '../storage/storage.manager';
import { imageProcessor } from '../processors/image-processor';
import { videoProcessor } from '../processors/video-processor';
import { mediaSecurityScanner } from '../processors/security-scanner';
import { mediaModerationProvider } from '../processors/moderation-provider';
import { logger } from '../../../observability/logger';

export class MediaQueueService {
  public async processMediaAsset(mediaId: string): Promise<void> {
    logger.info({ mediaId }, 'Processing media asset background job');

    const asset = await mediaRepository.getAssetById(mediaId);
    if (!asset) {
      logger.warn({ mediaId }, 'Media asset not found for processing');
      return;
    }

    if (asset.status === 'READY' || asset.status === 'QUARANTINED' || asset.status === 'DELETED') {
      logger.info({ mediaId, status: asset.status }, 'Media asset already in terminal state, skipping processing');
      return;
    }

    await mediaRepository.updateAssetStatus(mediaId, { status: 'PROCESSING' });

    try {
      const provider = storageManager.getProvider(asset.storageProvider);

      // 1. Security Scan & Content Moderation
      const scanResult = await mediaSecurityScanner.scan(mediaId, asset.objectKey);
      if (!scanResult.isClean) {
        logger.warn({ mediaId, threat: scanResult.threatName }, 'Media failed security scan, quarantining');
        await mediaRepository.updateAssetStatus(mediaId, { status: 'QUARANTINED' });
        return;
      }

      const modResult = await mediaModerationProvider.moderate(mediaId, asset.objectKey);
      if (modResult.status === 'REJECTED') {
        logger.warn({ mediaId, labels: modResult.labels }, 'Media rejected by moderation, quarantining');
        await mediaRepository.updateAssetStatus(mediaId, { status: 'QUARANTINED' });
        return;
      }

      // 2. Type-specific processing
      if (asset.mediaType === 'IMAGE') {
        const originalBuffer = await provider.download(asset.bucket, asset.objectKey);
        const dimensions = await imageProcessor.extractDimensions(originalBuffer);

        const variants = await imageProcessor.generateVariants(originalBuffer, asset.mimeType);

        for (const v of variants) {
          const variantKey = `media/${asset.ownerId}/${asset.id}/${v.variantName}`;
          await provider.upload(asset.bucket, variantKey, v.buffer, v.mimeType);
          await mediaRepository.createOrUpdateVariant({
            mediaId: asset.id,
            variantName: v.variantName,
            objectKey: variantKey,
            mimeType: v.mimeType,
            sizeBytes: v.sizeBytes,
            width: v.width,
            height: v.height,
          });
        }

        await mediaRepository.updateAssetStatus(mediaId, {
          status: 'READY',
          width: dimensions.width,
          height: dimensions.height,
        });
      } else if (asset.mediaType === 'VIDEO') {
        const videoMeta = await videoProcessor.extractMetadata(asset.objectKey);
        const thumb = await videoProcessor.generateVideoThumbnail(asset.objectKey);

        const thumbKey = `media/${asset.ownerId}/${asset.id}/thumbnail`;
        await provider.upload(asset.bucket, thumbKey, thumb.buffer, thumb.mimeType);

        await mediaRepository.createOrUpdateVariant({
          mediaId: asset.id,
          variantName: 'thumbnail',
          objectKey: thumbKey,
          mimeType: thumb.mimeType,
          sizeBytes: thumb.buffer.length,
          width: 640,
          height: 360,
        });

        await mediaRepository.updateAssetStatus(mediaId, {
          status: 'READY',
          width: videoMeta.width,
          height: videoMeta.height,
          duration: videoMeta.duration,
        });
      } else {
        // Document / Audio default ready
        await mediaRepository.updateAssetStatus(mediaId, { status: 'READY' });
      }

      // Update storage quota asynchronously
      await mediaRepository.updateUserQuotaUsed(asset.ownerId, asset.sizeBytes, 1);

      logger.info({ mediaId }, 'Media asset background processing completed successfully');
    } catch (error) {
      logger.error({ err: error, mediaId }, 'Error processing media asset background job');
      await mediaRepository.updateAssetStatus(mediaId, { status: 'FAILED' });
    }
  }

  public async runOrphanCleanup(): Promise<{ cleanedCount: number }> {
    logger.info('Starting orphan media cleanup job');
    const orphans = await mediaRepository.getOrphanedAssets(24);
    let cleanedCount = 0;

    for (const orphan of orphans) {
      try {
        const provider = storageManager.getProvider(orphan.storageProvider);
        await provider.delete(orphan.bucket, orphan.objectKey);
        await mediaRepository.hardDeleteAsset(orphan.id);
        cleanedCount++;
      } catch (err) {
        logger.error({ err, orphanId: orphan.id }, 'Error cleaning up orphaned media asset');
      }
    }

    logger.info({ cleanedCount }, 'Completed orphan media cleanup job');
    return { cleanedCount };
  }
}

export const mediaQueueService = new MediaQueueService();
