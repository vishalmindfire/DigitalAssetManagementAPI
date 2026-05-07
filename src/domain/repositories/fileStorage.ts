import { Readable } from 'stream';

export interface FileStorage {
  download(bucket: string, objectKey: string): Promise<Readable>;
  downloadFile(objectKey: string): Promise<Readable>;
  getFilesBucket(): string;
  getSignedURL(objectKey: string): Promise<string>;
  getThumbnailsBucket(): string;
  getVideosBucket(): string;
  upload(bucket: string, fileName: string, stream: Readable, mimeType: string): Promise<string>;
  uploadFile(fileName: string, stream: Readable, mimeType: string): Promise<string>;
  uploadThumbnail(fileName: string, stream: Readable, mimeType: string): Promise<string>;
  uploadVideo(fileName: string, stream: Readable, mimeType: string): Promise<string>;
}
