import { Pool } from 'pg';

import { File } from '#domain/entities/File.js';
import { FileTag } from '#domain/entities/FileTag.js';
import { FileTagRepository } from '#domain/repositories/fileTagRepository.js';
import { FileExtension } from '#domain/value-objects/FileExtension.js';
import { FileId } from '#domain/value-objects/FileId.js';
import { FileStatus } from '#domain/value-objects/FileStatus.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';

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

interface TagRow {
  id: number;
  tag: string;
}

export class PostgresFileTagsRepository implements FileTagRepository {
  constructor(private pool: Pool) {}

  async findByTag(tag: string): Promise<File[] | null> {
    const result = await this.pool.query<FileRow>(
      `SELECT * FROM file f
        INNER JOIN ref_file_tag ft ON f.id = ft.file_id
        INNER JOIN tag t ON t.id = ft.tag_id filetag 
        WHERE tag = $1`,
      [tag]
    );

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
  async getTag(tag: string): Promise<FileTag | null> {
    const result = await this.pool.query<TagRow>(
      `SELECT * FROM tag (tag)
       VALUES ($1)`,
      [tag]
    );
    if (result.rows.length === 0) return null;

    const row = result.rows[0];

    return new FileTag(row.id, row.tag, []);
  }

  async saveTag(tag: string, id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<TagRow>(
        `INSERT INTO tag (word)
            VALUES ($1)
            ON CONFLICT (word) DO NOTHING
            RETURNING id, word`,
        [tag]
      );
      if (result.rows.length !== 0) {
        await client.query(
          `INSERT INTO ref_file_tag (file_id, tag_id)
                VALUES ($1, $2)`,
          [id, result.rows[0].id]
        );
      }
      await client.query('COMMIT');
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      logger.error(`Tag insert error ${error instanceof Error ? error : 'unknown'}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
