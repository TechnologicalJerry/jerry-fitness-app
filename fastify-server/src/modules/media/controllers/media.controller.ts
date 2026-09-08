import { FastifyRequest, FastifyReply } from 'fastify';
import { mediaService } from '../services/media.service';
import { mediaRepository } from '../repositories/media.repository';
import { mediaQueueService } from '../jobs/media-queue.service';
import {
  UploadUrlRequestDto,
  CompleteUploadDto,
  AttachMediaDto,
  MediaVariantName,
} from '../types/media.types';

export class MediaController {
  // --- User Upload & Delivery Endpoints ---
  public async requestUploadUrl(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const body = request.body as UploadUrlRequestDto;

    const result = await mediaService.requestUploadUrl(userId, body);

    reply.status(201).send({
      success: true,
      data: result,
    });
  }

  public async completeUpload(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const { mediaId } = request.params as { mediaId: string };
    const body = (request.body as CompleteUploadDto) || {};

    const updated = await mediaService.completeUpload(userId, mediaId, body);

    reply.send({
      success: true,
      data: updated,
    });
  }

  public async getMediaAsset(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.id;
    const userRole = request.user?.role;
    const { mediaId } = request.params as { mediaId: string };

    const asset = await mediaService.getMediaAsset(userId, userRole, mediaId);

    reply.send({
      success: true,
      data: asset,
    });
  }

  public async getSignedUrl(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.id;
    const userRole = request.user?.role;
    const { mediaId } = request.params as { mediaId: string };
    const query = (request.query as { variant?: MediaVariantName; expiresIn?: number }) || {};

    const result = await mediaService.getSignedDeliveryUrl(
      userId,
      userRole,
      mediaId,
      query.variant || 'original',
      query.expiresIn || 3600,
    );

    reply.send({
      success: true,
      data: result,
    });
  }

  public async getVariants(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user?.id;
    const userRole = request.user?.role;
    const { mediaId } = request.params as { mediaId: string };

    const asset = await mediaService.getMediaAsset(userId, userRole, mediaId);

    reply.send({
      success: true,
      data: asset.variants || [],
    });
  }

  public async deleteMediaAsset(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const userRole = request.user!.role;
    const { mediaId } = request.params as { mediaId: string };

    await mediaService.deleteMediaAsset(userId, userRole, mediaId);

    reply.send({
      success: true,
      message: 'Media asset deleted successfully',
    });
  }

  public async attachMedia(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = request.user!.id;
    const userRole = request.user!.role;
    const { mediaId } = request.params as { mediaId: string };
    const body = request.body as AttachMediaDto;

    const attachment = await mediaService.attachMedia(userId, userRole, mediaId, body);

    reply.status(201).send({
      success: true,
      data: attachment,
    });
  }

  public async detachMedia(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { attachmentId } = request.params as { mediaId: string; attachmentId: string };
    await mediaService.detachMedia(attachmentId);

    reply.send({
      success: true,
      message: 'Attachment deleted successfully',
    });
  }

  // --- Admin Operations ---
  public async listAdminMedia(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = (request.query as any) || {};
    const res = await mediaRepository.listAssets(query);

    reply.send({
      success: true,
      data: res.items,
      meta: {
        nextCursor: res.nextCursor,
        hasMore: !!res.nextCursor,
        total: res.total,
      },
    });
  }

  public async getAdminMediaById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { mediaId } = request.params as { mediaId: string };
    const asset = await mediaRepository.getAssetById(mediaId);

    reply.send({
      success: true,
      data: asset,
    });
  }

  public async reprocessAdminMedia(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { mediaId } = request.params as { mediaId: string };
    await mediaQueueService.processMediaAsset(mediaId);

    reply.status(202).send({
      success: true,
      message: 'Media reprocessing job enqueued',
    });
  }

  public async rebuildAdminMedia(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await mediaQueueService.runOrphanCleanup();

    reply.send({
      success: true,
      message: 'Media cleanup job executed successfully',
      data: result,
    });
  }
}

export const mediaController = new MediaController();
