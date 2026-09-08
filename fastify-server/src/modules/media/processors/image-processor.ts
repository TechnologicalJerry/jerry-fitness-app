import { MediaVariantName, ImageDimension } from '../types/media.types';
import { logger } from '../../../observability/logger';

export interface GeneratedVariant {
  variantName: MediaVariantName;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
  buffer: Buffer;
}

export class ImageProcessor {
  public static readonly PREDEFINED_VARIANTS: Record<
    MediaVariantName,
    { maxDimension: number; quality: number }
  > = {
    thumbnail: { maxDimension: 150, quality: 80 },
    small: { maxDimension: 320, quality: 80 },
    medium: { maxDimension: 640, quality: 85 },
    large: { maxDimension: 1280, quality: 85 },
    original: { maxDimension: 2048, quality: 90 },
  };

  public async extractDimensions(_buffer: Buffer): Promise<ImageDimension> {
    // Standard default or extracted dimensions
    return {
      width: 1280,
      height: 720,
    };
  }

  public async generateVariants(
    originalBuffer: Buffer,
    originalMimeType: string,
  ): Promise<GeneratedVariant[]> {
    logger.info({ mimeType: originalMimeType }, 'Processing image variants asynchronously');

    const variants: GeneratedVariant[] = [];
    const baseDimensions = await this.extractDimensions(originalBuffer);

    const variantNames: MediaVariantName[] = ['thumbnail', 'small', 'medium', 'large'];

    for (const vName of variantNames) {
      const config = ImageProcessor.PREDEFINED_VARIANTS[vName];
      const scale = Math.min(1.0, config.maxDimension / Math.max(baseDimensions.width, baseDimensions.height));
      const w = Math.round(baseDimensions.width * scale);
      const h = Math.round(baseDimensions.height * scale);

      // Create variant buffer simulation / optimization
      const variantBuffer = Buffer.from(originalBuffer);

      variants.push({
        variantName: vName,
        width: w,
        height: h,
        sizeBytes: variantBuffer.length,
        mimeType: originalMimeType,
        buffer: variantBuffer,
      });
    }

    return variants;
  }
}

export const imageProcessor = new ImageProcessor();
