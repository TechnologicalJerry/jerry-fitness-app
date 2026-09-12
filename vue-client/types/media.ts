export interface MediaAsset {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl?: string;
  cdnUrl?: string;
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
}

export interface UploadUrlRequestDto {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  entityType?: string;
  entityId?: string;
}

export interface UploadUrlResponseDto {
  mediaId: string;
  uploadUrl: string;
  expiresAt: string;
}
