import { FastifyInstance } from 'fastify';
import { mediaController } from '../controllers/media.controller';
import {
  requestUploadUrlSchema,
  completeUploadSchema,
  getSignedUrlSchema,
  attachMediaSchema,
} from '../schemas/media.schema';

export async function mediaRoutes(fastify: FastifyInstance): Promise<void> {
  // --- User Upload & Delivery Endpoints ---
  fastify.post(
    '/media/upload-url',
    {
      preHandler: [fastify.authenticate],
      schema: requestUploadUrlSchema,
    },
    mediaController.requestUploadUrl.bind(mediaController),
  );

  fastify.post(
    '/media/:mediaId/complete',
    {
      preHandler: [fastify.authenticate],
      schema: completeUploadSchema,
    },
    mediaController.completeUpload.bind(mediaController),
  );

  fastify.get(
    '/media/:mediaId',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: {
        description: 'Get media asset metadata',
        tags: ['Media'],
      },
    },
    mediaController.getMediaAsset.bind(mediaController),
  );

  fastify.get(
    '/media/:mediaId/url',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: getSignedUrlSchema,
    },
    mediaController.getSignedUrl.bind(mediaController),
  );

  fastify.get(
    '/media/:mediaId/variants',
    {
      preHandler: [fastify.optionalAuthenticate],
      schema: {
        description: 'Get all generated variants for a media asset',
        tags: ['Media'],
      },
    },
    mediaController.getVariants.bind(mediaController),
  );

  fastify.delete(
    '/media/:mediaId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Delete a media asset',
        tags: ['Media'],
      },
    },
    mediaController.deleteMediaAsset.bind(mediaController),
  );

  fastify.post(
    '/media/:mediaId/attach',
    {
      preHandler: [fastify.authenticate],
      schema: attachMediaSchema,
    },
    mediaController.attachMedia.bind(mediaController),
  );

  fastify.delete(
    '/media/:mediaId/attachments/:attachmentId',
    {
      preHandler: [fastify.authenticate],
      schema: {
        description: 'Detach media asset from entity',
        tags: ['Media'],
      },
    },
    mediaController.detachMedia.bind(mediaController),
  );

  // --- Admin Endpoints ---
  fastify.get(
    '/admin/media',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'List media assets with pagination and filters (Admin)',
        tags: ['Admin', 'Media'],
      },
    },
    mediaController.listAdminMedia.bind(mediaController),
  );

  fastify.get(
    '/admin/media/:mediaId',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'Get detailed media asset metadata (Admin)',
        tags: ['Admin', 'Media'],
      },
    },
    mediaController.getAdminMediaById.bind(mediaController),
  );

  fastify.post(
    '/admin/media/:mediaId/reprocess',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'Trigger asynchronous reprocessing of a media asset (Admin)',
        tags: ['Admin', 'Media'],
      },
    },
    mediaController.reprocessAdminMedia.bind(mediaController),
  );

  fastify.post(
    '/admin/media/rebuild',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
      schema: {
        description: 'Trigger media orphan cleanup and index rebuild (Admin)',
        tags: ['Admin', 'Media'],
      },
    },
    mediaController.rebuildAdminMedia.bind(mediaController),
  );
}
