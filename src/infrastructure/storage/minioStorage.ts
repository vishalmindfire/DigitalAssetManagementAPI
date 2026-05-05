import { Client } from 'minio';

import { FileStorage } from '#domain/repositories/fileStorage.js';

export class MinioStorage implements FileStorage {
  constructor(
    private client: Client,
    private bucket: string,
    private thumbnailBucket: string,
    private videoBucket: string
  ) {}

  async download(objectKey: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, objectKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as ArrayBuffer));
    }
    const buffer = Buffer.concat(chunks);
    return buffer;
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

  async upload(bucket: string, fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.putObject(bucket, fileName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    return `${this.bucket}/${fileName}`;
  }

  async uploadFile(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.upload(this.bucket, fileName, buffer, mimeType);
  }

  async uploadThumbnail(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    return this.upload(this.thumbnailBucket, fileName, buffer, mimeType);
  }
}
