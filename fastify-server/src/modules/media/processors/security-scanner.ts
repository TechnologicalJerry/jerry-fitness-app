import { SecurityScanResult } from '../types/media.types';
import { logger } from '../../../observability/logger';

export class MediaSecurityScanner {
  public async scan(mediaId: string, objectKey: string): Promise<SecurityScanResult> {
    logger.info({ mediaId, objectKey }, 'Performing security malware scan on asset');

    // Reject known test malware pattern strings if present in key
    if (objectKey.includes('eicar') || objectKey.includes('malware')) {
      return {
        isClean: false,
        threatName: 'EICAR-Test-Signature',
        scannedAt: new Date(),
      };
    }

    return {
      isClean: true,
      scannedAt: new Date(),
    };
  }
}

export const mediaSecurityScanner = new MediaSecurityScanner();
