import { spawn } from 'child_process';

import { MetaData } from '#domain/entities/MetaData.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
import { AssetMessage } from '#infrastructure/messaging/types/asset.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';

export class GenerateVideoThumbnail {
  constructor(
    private asset: AssetMessage,
    private storage: MinioStorage,
    private videoBuffer: Buffer
  ) {}

  extractImageMetadata(buffer: Buffer): Promise<MetaData> {
    return new Promise((resolve, reject) => {
      const args = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name', '-of', 'json', 'pipe:0'];

      const ffprobe = spawn('ffprobe', args, { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      ffprobe.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      ffprobe.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(stderr));
          return;
        }
        try {
          const parsed = JSON.parse(stdout) as { streams?: { codec_name: string; height: number; width: number }[] };
          const stream = parsed.streams?.[0];
          if (!stream) {
            reject(new Error('No video stream found'));
            return;
          }
          resolve(new MetaData(stream.codec_name, stream.height, stream.width, buffer.length));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      ffprobe.stdin.write(buffer);
      ffprobe.stdin.end();
    });
  }

  async generate(): Promise<void> {
    const thumbBuffer = await this.generateThumbnail();
    const key = this.thumbnailKey(this.asset.objectKey);
    await this.storage.uploadThumbnail(key, thumbBuffer, 'image/jpeg');
    logger.info(`[video] thumbnail uploaded → ${key}`);
  }

  thumbnailKey(objectKey: string): string {
    const withoutExt = objectKey.replace(/\.[^.]+$/, '');
    return `${withoutExt}.jpg`;
  }

  private generateThumbnail(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const args = [
        '-hide_banner',
        '-loglevel',
        'error',
        '-ss',
        '00:00:02',
        '-i',
        'pipe:0',
        '-frames:v',
        '1',
        '-vf',
        'thumbnail,scale=320:-1',
        '-q:v',
        '2',
        '-f',
        'image2',
        'pipe:1',
      ];

      const ffmpeg = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

      const chunks: Buffer[] = [];
      const errors: Buffer[] = [];

      ffmpeg.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      ffmpeg.stderr.on('data', (chunk: Buffer) => {
        errors.push(chunk);
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          logger.info('[video] thumbnail generated');
          resolve(Buffer.concat(chunks));
        } else {
          const msg = `FFmpeg failed: ${Buffer.concat(errors).toString()}`;
          logger.error(msg);
          reject(new Error(msg));
        }
      });

      ffmpeg.stdin.write(this.videoBuffer);
      ffmpeg.stdin.end();
    });
  }
}
