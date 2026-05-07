import { File } from '#domain/entities/File.js';

export interface FileRepository {
  findById(id: string): Promise<File | null>;
  findByName(name: string): Promise<File | null>;
  findByObjectKey(bucket: string, objectKey: string): Promise<File | null>;
  getFiles(limit?: number, offset?: number): Promise<File[] | null>;
  save(file: File): Promise<void>;
}
