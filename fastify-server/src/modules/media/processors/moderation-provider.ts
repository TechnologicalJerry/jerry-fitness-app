import { ModerationResult } from '../types/media.types';
import { logger } from '../../../observability/logger';

export class MediaModerationProvider {
  public async moderate(mediaId: string, objectKey: string): Promise<ModerationResult> {
    logger.info({ mediaId, objectKey }, 'Evaluating content moderation policy');

    if (objectKey.includes('explicit') || objectKey.includes('nsfw')) {
      return {
        status: 'REJECTED',
        confidence: 0.99,
        labels: ['ExplicitContent'],
      };
    }

    if (objectKey.includes('flagged')) {
      return {
        status: 'REVIEW_REQUIRED',
        confidence: 0.75,
        labels: ['RequiresHumanReview'],
      };
    }

    return {
      status: 'SAFE',
      confidence: 0.99,
      labels: ['Clean'],
    };
  }
}

export const mediaModerationProvider = new MediaModerationProvider();
