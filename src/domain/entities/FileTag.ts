import { File } from '#domain/entities/File.js';

interface fileTag {
  id: number;
  tag: string;
  files: File[] | [];
}

export class FileTag implements fileTag {
  constructor(
    public readonly id: fileTag['id'],
    public readonly tag: fileTag['tag'],
    public files: fileTag['files']
  ) {}

  getTagId(): number {
    return this.id;
  }

  getTag(): string {
    return this.tag;
  }

  getFiles() {
    return this.files;
  }
}
