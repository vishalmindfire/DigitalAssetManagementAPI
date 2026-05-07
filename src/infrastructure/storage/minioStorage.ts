import { Client } from 'minio';
import { Readable } from 'stream';

import { FileStorage } from '#domain/repositories/fileStorage.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
export class MinioStorage implements FileStorage {
  constructor(
    private client: Client,
    private bucket: string,
    private thumbnailBucket: string,
    private videoBucket: string
  ) {}

  async download(bucket: string, objectKey: string): Promise<Readable> {
    try {
      const stream = await this.client.getObject(bucket, objectKey);

      stream.on('error', (err) => {
        logger.error(`[MinIO READ ERROR] ${bucket}/${objectKey}: ${err}`);
      });

      return stream;
    } catch (err) {
      logger.error(`[MinIO GET OBJECT FAILED] ${bucket}/${objectKey}: ${err instanceof Error ? err.message : 'unexpected error'}`);
      throw err;
    }
  }

  async downloadFile(objectKey: string): Promise<Readable> {
    return this.download(this.bucket, objectKey);
  }

  getFilesBucket(): string {
    return this.bucket;
  }

  getThumbnailsBucket(): string {
    return this.thumbnailBucket;
  }

  getVideosBucket(): string {
    return this.videoBucket;
  }

  async getSignedURL(objectKey: string): Promise<string> {
    try {
      const url = await this.client.presignedPutObject(this.getFilesBucket(), objectKey, 86400);
      logger.info(`[MinIO] presigned URL generated for ${objectKey}`);
      return url;
    } catch (err) {
      logger.error(`[MinIO URL ERROR] ${objectKey}: ${err instanceof Error ? err.message : 'unexpected error'}`);
      throw err;
    }
  }

  async upload(bucket: string, fileName: string, stream: Readable, mimeType: string): Promise<string> {
    await this.client.putObject(bucket, fileName, stream, undefined, {
      'Content-Type': mimeType,
    });

    return `${this.bucket}/${fileName}`;
  }

  async uploadFile(fileName: string, stream: Readable, mimeType: string): Promise<string> {
    return this.upload(this.bucket, fileName, stream, mimeType);
  }

  async uploadThumbnail(fileName: string, stream: Readable, mimeType: string): Promise<string> {
    return this.upload(this.thumbnailBucket, fileName, stream, mimeType);
  }

  async uploadVideo(fileName: string, stream: Readable, mimeType: string): Promise<string> {
    return this.upload(this.videoBucket, fileName, stream, mimeType);
  }
}
