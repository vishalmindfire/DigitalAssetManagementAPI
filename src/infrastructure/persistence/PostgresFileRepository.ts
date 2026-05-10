import { Pool } from 'pg';

import { File, FilesResponse } from '#domain/entities/File.js';
import { FileRepository } from '#domain/repositories/fileRepository.js';
import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';

interface FileRow {
  bucket: string;
  created_at: Date;
  ext: string;
  id: string;
  mime_type: string;
  object_key: string;
  size: number;
  user_id: string;
  progress: number;
  status: string;
  top_id: string;
  updated_at: Date | null;
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
      row.size,
      row.user_id,
      row.progress,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.created_at,
      row.updated_at
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
      row.size,
      row.user_id,
      row.progress,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.created_at,
      row.updated_at
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
      row.size,
      row.user_id,
      row.progress,
      FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
      row.created_at,
      row.updated_at
    );
  }

  async getFiles(userid: string, cursor: { fileId: string; createDate: Date } | null, limit: number, role: string): Promise<FilesResponse> {
    const values: unknown[] = [];
    let condition = 'WHERE 1=1';
    if (role !== 'admin') {
      condition += `
        AND user_id = $1
      `;
      values.push(userid);
    }
    if (cursor) {
      const p = values.length + 1;
      values.push(cursor.createDate);
      values.push(cursor.fileId);

      condition += `
        AND (
          created_at < $${String(p)}
          OR (
            created_at = $${String(p)}
            AND id < $${String(p + 1)}
          )
        )
      `;
    }

    values.push(limit + 1);
    const query = 'SELECT * FROM file';
    const filter = 'ORDER BY created_at DESC';
    const result = await this.pool.query<FileRow>(`${query} ${condition} ${filter} LIMIT $${String(values.length)}`, values);

    if (result.rows.length === 0) return { files: null, nextCursor: null };
    const hasMore = result.rows.length > limit;

    const files = hasMore ? result.rows.slice(0, limit) : result.rows;

    const nextCursor = hasMore
      ? {
          fileId: files[files.length - 1].id,
          createDate: files[files.length - 1].created_at,
        }
      : null;

    return {
      files: files.map((row) => {
        return new File(
          new FileId(row.id),
          new FileId(row.top_id),
          FileExtension.from(row.ext as Parameters<typeof FileExtension.from>[0]),
          row.mime_type,
          row.bucket,
          row.object_key,
          row.size,
          row.user_id,
          row.progress,
          FileStatus.from(row.status as Parameters<typeof FileStatus.from>[0]),
          row.created_at,
          row.updated_at
        );
      }),
      nextCursor: nextCursor,
    };
  }

  async updateFileStatus(id: string, status: string): Promise<void> {
    await this.pool.query(`UPDATE file SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
  }

  async save(file: File): Promise<void> {
    await this.pool.query(
      `INSERT INTO file (id, top_id, ext, mime_type, bucket, object_key, progress, status, created_at, updated_at, user_id, size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
        file.getUserId(),
        file.getSize(),
      ]
    );
  }
}
