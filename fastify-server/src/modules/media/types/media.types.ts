export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';

export type MediaStatus =
  | 'PENDING'
  | 'UPLOADING'
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED'
  | 'QUARANTINED'
  | 'DELETED';

export type MediaVisibility =
  | 'PRIVATE'
  | 'PUBLIC'
  | 'TRAINER_ONLY'
  | 'FOLLOWERS'
  | 'UNLISTED';

export type MediaContext =
  | 'PROFILE_AVATAR'
  | 'PROGRESS_PHOTO'
  | 'EXERCISE_VIDEO'
  | 'EXERCISE_THUMBNAIL'
  | 'WORKOUT_MEDIA'
  | 'RECIPE_IMAGE'
  | 'TRAINER_MEDIA'
  | 'SOCIAL_POST'
  | 'CHALLENGE_MEDIA';

export type MediaVariantName = 'thumbnail' | 'small' | 'medium' | 'large' | 'original';

export interface UploadUrlRequestDto {
  fileName: string;
  contentType: string;
  size: number;
  mediaType: MediaType;
  context: MediaContext;
  contextId?: string;
  visibility?: MediaVisibility;
}

export interface UploadUrlResponseDto {
  mediaId: string;
  uploadUrl: string;
  expiresAt: string;
  objectKey: string;
  bucket: string;
}

export interface CompleteUploadDto {
  checksum?: string;
}

export interface SignedUrlResponseDto {
  url: string;
  expiresAt: string;
  variant?: MediaVariantName;
}

export interface AttachMediaDto {
  entityType: string;
  entityId: string;
  sortOrder?: number;
}

export interface StorageObjectMetadata {
  contentLength: number;
  contentType: string;
  etag?: string;
  lastModified?: Date;
  customMetadata?: Record<string, string>;
}

export interface ImageDimension {
  width: number;
  height: number;
}

export interface VideoMetadataResult {
  duration?: number;
  width?: number;
  height?: number;
  bitrate?: number;
  format?: string;
}

export interface SecurityScanResult {
  isClean: boolean;
  threatName?: string;
  scannedAt: Date;
}

export interface ModerationResult {
  status: 'SAFE' | 'REVIEW_REQUIRED' | 'REJECTED';
  confidence: number;
  labels?: string[];
}
