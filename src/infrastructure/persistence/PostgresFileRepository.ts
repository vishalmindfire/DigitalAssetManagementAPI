import { Pool } from 'pg';

import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

interface FileRow {
  ext: string;
  id: string;
  name: string;
  path: string;
  status: string;
  upload_date: Date | null;
}

export class PostgresFileRepository implements FileRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<File | null> {
    const result = await this.pool.query<FileRow>('SELECT * FROM files WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new File(
      new FileId(row.id),
      row.name,
      FileExtension.from(row.ext as Parameters<typeof FileExtension.from>[0]),
      row.path,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.upload_date ?? null
    );
  }

  async save(file: File): Promise<void> {
    await this.pool.query(
      `INSERT INTO files ( name, mime_type, storage_path, created_at, project_id, size)
       VALUES ($1, $2, $3, NOW(), 3, 99)`,
      [file.name, file.getExtension(), file.path]
    );
  }
}
