import { File } from '#domain/entities/File.js';
import { FileTag } from '#domain/entities/FileTag.js';

export interface FileTagRepository {
  findByTag(tag: string): Promise<File[] | null>;
  getTag(tag: string): Promise<FileTag | null>;
  saveTag(tag: string, file: string): Promise<void>;
}
