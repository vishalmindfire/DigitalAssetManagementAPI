export interface FileStorage {
  download(objectKey: string): Promise<Buffer>;
  getFilesBucket(): string;
  getThumbnailsBucket(): string;
  getVideosBucket(): string;
  upload(bucket: string, fileName: string, buffer: Buffer, mimeType: string): Promise<string>;
  uploadFile(fileName: string, buffer: Buffer, mimeType: string): Promise<string>;
  uploadThumbnail(fileName: string, buffer: Buffer, mimeType: string): Promise<string>;
}
