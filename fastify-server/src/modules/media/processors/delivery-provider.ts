import { storageManager } from '../storage/storage.manager';
import { MediaVariantName, SignedUrlResponseDto } from '../types/media.types';

export class MediaDeliveryProvider {
  public async getDeliveryUrl(
    bucket: string,
    objectKey: string,
    expiresInSeconds = 3600,
    variant?: MediaVariantName,
    fileName?: string,
  ): Promise<SignedUrlResponseDto> {
    const provider = storageManager.getDefaultProvider();
    const url = await provider.createDownloadUrl({
      bucket,
      objectKey,
      expiresInSeconds,
      fileName,
    });

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    return {
      url,
      expiresAt,
      variant,
    };
  }
}

export const mediaDeliveryProvider = new MediaDeliveryProvider();
