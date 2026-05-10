import { File, FilesResponse } from '#domain/entities/File.js';

export interface FileRepository {
  findById(id: string): Promise<File | null>;
  findByName(name: string): Promise<File | null>;
  findByObjectKey(bucket: string, objectKey: string): Promise<File | null>;
  getFiles(
    userid: string,
    cursor: {
      fileId: string;
      createDate: Date;
    } | null,
    limit: number,
    role: string
  ): Promise<FilesResponse>;
  save(file: File): Promise<void>;
  updateFileStatus(id: string, status: string): Promise<void>;
}
