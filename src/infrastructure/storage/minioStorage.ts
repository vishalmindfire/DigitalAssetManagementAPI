import { Client } from 'minio';

import { FileStorage } from '#domain/repositories/fileStorage.js';

export class MinioStorage implements FileStorage {
  constructor(
    private client: Client,
    private bucket: string
  ) {}

  async upload(fileName: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.client.putObject(this.bucket, fileName, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    return `${this.bucket}/${fileName}`;
  }
}
