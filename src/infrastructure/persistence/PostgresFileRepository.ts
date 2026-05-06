import { Pool } from 'pg';

import { File } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

interface FileRow {
  bucket: string;
  created_date: Date;
  ext: string;
  id: string;
  mime_type: string;
  object_key: string;
  progress: number;
  status: string;
  top_id: string;
  updated_date: Date | null;
}

export class PostgresFileRepository implements FileRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<File | null> {
    const result = await this.pool.query<FileRow>('SELECT * FROM file WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new File(
      new FileId(row.id),
      new FileId(row.top_id),
      FileExtension.from(row.ext as Parameters<typeof FileExtension.from>[0]),
      row.mime_type,
      row.bucket,
      row.object_key,
      row.progress,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.created_date,
      row.updated_date
    );
  }

  async findByName(id: string): Promise<File | null> {
    const result = await this.pool.query<FileRow>('SELECT * FROM file WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new File(
      new FileId(row.id),
      new FileId(row.top_id),
      FileExtension.from(row.ext as Parameters<typeof FileExtension.from>[0]),
      row.mime_type,
      row.bucket,
      row.object_key,
      row.progress,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.created_date,
      row.updated_date
    );
  }

  async findByObjectKey(bucket: string, objectKey: string): Promise<File | null> {
    const result = await this.pool.query<FileRow>('SELECT * FROM file WHERE bucket = $1 AND object_key = $2', [bucket, objectKey]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new File(
      new FileId(row.id),
      new FileId(row.top_id),
      FileExtension.from(row.ext as Parameters<typeof FileExtension.from>[0]),
      row.mime_type,
      row.bucket,
      row.object_key,
      row.progress,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.created_date,
      row.updated_date
    );
  }

  async getFiles(id: string): Promise<File[] | null> {
    const result = await this.pool.query<FileRow>('SELECT * FROM file WHERE id = $1', [id]);

    if (result.rows.length === 0) return null;

    const files: File[] = result.rows.map((row) => {
      return new File(
        new FileId(row.id),
        new FileId(row.top_id),
        FileExtension.from(row.ext as Parameters<typeof FileExtension.from>[0]),
        row.mime_type,
        row.bucket,
        row.object_key,
        row.progress,
        FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
        row.created_date,
        row.updated_date
      );
    });

    return files;
  }

  async save(file: File): Promise<void> {
    await this.pool.query(
      `INSERT INTO file (id, top_id, ext, mime_type, bucket, object_key, progress, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         progress = EXCLUDED.progress,
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
      [
        file.getId(),
        file.getTopId(),
        file.getExtension(),
        file.getMimeType(),
        file.getBucket(),
        file.getObjectKey(),
        file.getProgress(),
        file.getStatus(),
        file.getCreatedDate(),
        file.getUpdatedDate(),
      ]
    );
  }
}
