import { File } from '#domain/entities/File.js';

export interface FileRepository {
  findById(id: string): Promise<File | null>;
  save(file: File): Promise<void>;
}
