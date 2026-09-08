import { StorageObjectMetadata } from '../types/media.types';

export interface CreateUploadUrlOptions {
  bucket: string;
  objectKey: string;
  contentType: string;
  expiresInSeconds: number;
}

export interface CreateDownloadUrlOptions {
  bucket: string;
  objectKey: string;
  expiresInSeconds: number;
  fileName?: string;
  contentType?: string;
}

export interface StorageProvider {
  readonly providerName: string;

  createUploadUrl(options: CreateUploadUrlOptions): Promise<string>;

  createDownloadUrl(options: CreateDownloadUrlOptions): Promise<string>;

  upload(
    bucket: string,
    objectKey: string,
    content: Buffer,
    contentType: string,
  ): Promise<{ objectKey: string; sizeBytes: number; etag?: string }>;

  download(bucket: string, objectKey: string): Promise<Buffer>;

  delete(bucket: string, objectKey: string): Promise<void>;

  exists(bucket: string, objectKey: string): Promise<boolean>;

  getMetadata(bucket: string, objectKey: string): Promise<StorageObjectMetadata | null>;

  copy(
    sourceBucket: string,
    sourceKey: string,
    targetBucket: string,
    targetKey: string,
  ): Promise<void>;

  move(
    sourceBucket: string,
    sourceKey: string,
    targetBucket: string,
    targetKey: string,
  ): Promise<void>;
}
