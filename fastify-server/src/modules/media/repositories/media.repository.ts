import {
  PrismaClient,
  MediaAsset,
  MediaVariant,
  MediaAttachment,
  MediaAccessLog,
  UserStorageQuota,
} from '@prisma/client';
import { prismaService } from '../../../database/prisma.service';
import { MediaContext, MediaType, MediaVisibility, MediaVariantName } from '../types/media.types';

export class MediaRepository {
  private db: PrismaClient;

  constructor(customPrisma?: PrismaClient) {
    this.db = customPrisma || prismaService;
  }

  // --- Asset Management ---
  public async createAsset(data: {
    ownerId: string;
    storageProvider: string;
    bucket: string;
    objectKey: string;
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    checksum?: string;
    mediaType: MediaType;
    status: string;
    visibility: MediaVisibility;
    context?: MediaContext;
    contextId?: string;
    metadata?: Record<string, any>;
  }): Promise<MediaAsset> {
    return this.db.mediaAsset.create({
      data: {
        ownerId: data.ownerId,
        storageProvider: data.storageProvider,
        bucket: data.bucket,
        objectKey: data.objectKey,
        originalFileName: data.originalFileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        checksum: data.checksum,
        mediaType: data.mediaType,
        status: data.status,
        visibility: data.visibility,
        context: data.context,
        contextId: data.contextId,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      },
    });
  }

  public async getAssetById(id: string): Promise<(MediaAsset & { variants: MediaVariant[]; attachments: MediaAttachment[] }) | null> {
    return this.db.mediaAsset.findUnique({
      where: { id },
      include: {
        variants: true,
        attachments: true,
      },
    });
  }

  public async updateAssetStatus(
    id: string,
    data: {
      status: string;
      width?: number;
      height?: number;
      duration?: number;
      checksum?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<MediaAsset> {
    return this.db.mediaAsset.update({
      where: { id },
      data: {
        status: data.status,
        ...(data.width !== undefined ? { width: data.width } : {}),
        ...(data.height !== undefined ? { height: data.height } : {}),
        ...(data.duration !== undefined ? { duration: data.duration } : {}),
        ...(data.checksum ? { checksum: data.checksum } : {}),
        ...(data.metadata ? { metadata: data.metadata as any } : {}),
      },
    });
  }

  public async softDeleteAsset(id: string): Promise<MediaAsset> {
    return this.db.mediaAsset.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });
  }

  public async hardDeleteAsset(id: string): Promise<void> {
    await this.db.mediaAsset.delete({
      where: { id },
    });
  }

  // --- Variant Management ---
  public async createOrUpdateVariant(data: {
    mediaId: string;
    variantName: MediaVariantName;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
  }): Promise<MediaVariant> {
    return this.db.mediaVariant.upsert({
      where: {
        mediaId_variantName: {
          mediaId: data.mediaId,
          variantName: data.variantName,
        },
      },
      create: {
        mediaId: data.mediaId,
        variantName: data.variantName,
        objectKey: data.objectKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: data.width,
        height: data.height,
      },
      update: {
        objectKey: data.objectKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: data.width,
        height: data.height,
      },
    });
  }

  public async getVariant(mediaId: string, variantName: string): Promise<MediaVariant | null> {
    return this.db.mediaVariant.findUnique({
      where: {
        mediaId_variantName: {
          mediaId,
          variantName,
        },
      },
    });
  }

  // --- Attachment Management ---
  public async createAttachment(data: {
    mediaId: string;
    entityType: string;
    entityId: string;
    sortOrder?: number;
  }): Promise<MediaAttachment> {
    return this.db.mediaAttachment.create({
      data: {
        mediaId: data.mediaId,
        entityType: data.entityType,
        entityId: data.entityId,
        sortOrder: data.sortOrder || 0,
      },
    });
  }

  public async deleteAttachment(attachmentId: string): Promise<void> {
    await this.db.mediaAttachment.delete({
      where: { id: attachmentId },
    });
  }

  public async getAttachmentsByEntity(entityType: string, entityId: string): Promise<(MediaAttachment & { mediaAsset: MediaAsset })[]> {
    return this.db.mediaAttachment.findMany({
      where: { entityType, entityId },
      include: { mediaAsset: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // --- Access Logs ---
  public async logAccess(data: {
    mediaId: string;
    viewerId?: string;
    action: string;
    requestId?: string;
  }): Promise<MediaAccessLog> {
    return this.db.mediaAccessLog.create({
      data: {
        mediaId: data.mediaId,
        viewerId: data.viewerId,
        action: data.action,
        requestId: data.requestId,
      },
    });
  }

  // --- Quotas ---
  public async getUserQuota(userId: string): Promise<UserStorageQuota> {
    const existing = await this.db.userStorageQuota.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    return this.db.userStorageQuota.create({
      data: {
        userId,
        maxSizeBytes: 5368709120, // 5 GB default
        usedSizeBytes: 0,
        assetCount: 0,
      },
    });
  }

  public async updateUserQuotaUsed(userId: string, addedBytes: number, assetDelta = 1): Promise<UserStorageQuota> {
    const quota = await this.getUserQuota(userId);
    const newUsed = Math.max(0, quota.usedSizeBytes + addedBytes);
    const newCount = Math.max(0, quota.assetCount + assetDelta);

    return this.db.userStorageQuota.update({
      where: { userId },
      data: {
        usedSizeBytes: newUsed,
        assetCount: newCount,
      },
    });
  }

  // --- Admin Queries ---
  public async listAssets(filters: {
    ownerId?: string;
    status?: string;
    mediaType?: string;
    context?: string;
    visibility?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ items: MediaAsset[]; nextCursor?: string; total: number }> {
    const take = Math.min(filters.limit || 20, 50);
    const where: any = {};

    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.status) where.status = filters.status;
    if (filters.mediaType) where.mediaType = filters.mediaType;
    if (filters.context) where.context = filters.context;
    if (filters.visibility) where.visibility = filters.visibility;

    const total = await this.db.mediaAsset.count({ where });

    const queryArgs: any = {
      where,
      take: take + 1,
      orderBy: { createdAt: 'desc' },
    };

    if (filters.cursor) {
      queryArgs.cursor = { id: filters.cursor };
      queryArgs.skip = 1;
    }

    const items = await this.db.mediaAsset.findMany(queryArgs);

    let nextCursor: string | undefined;
    if (items.length > take) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return {
      items,
      nextCursor,
      total,
    };
  }

  public async getOrphanedAssets(olderThanHours = 24): Promise<MediaAsset[]> {
    const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    return this.db.mediaAsset.findMany({
      where: {
        status: { in: ['PENDING', 'UPLOADING', 'FAILED'] },
        createdAt: { lt: cutoffDate },
      },
      take: 100,
    });
  }
}

export const mediaRepository = new MediaRepository();
