export interface FileStorage {
  upload(fileName: string, buffer: Buffer, mimeType: string): Promise<string>;
}
