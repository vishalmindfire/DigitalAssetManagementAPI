import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { PassThrough, pipeline, Readable } from 'stream';

import { MetaData } from '#domain/entities/MetaData.js';
import { VideoRendition } from '#domain/entities/VideoRendition.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';

export class VideoProcessor {
  static readonly FFMPEG_BIN = process.env.FFMPEG_PATH ?? ffmpegPath ?? 'ffmpeg';

  extractImageMetadata(input: Readable): Promise<MetaData> {
    return new Promise((resolve, reject) => {
      const args = ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_name', '-of', 'json', 'pipe:0'];

      const ffprobe = spawn(ffprobeStatic.path, args, { stdio: ['pipe', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';
      let byteCount = 0;

      ffprobe.on('error', reject);
      ffprobe.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });
      ffprobe.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      ffprobe.stdin.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code !== 'EPIPE') reject(err);
      });

      ffprobe.on('close', (code) => {
        input.unpipe(ffprobe.stdin);
        if (code !== 0) {
          reject(new Error(stderr));
          return;
        }
        try {
          const parsed = JSON.parse(stdout) as { streams?: { codec_name: string; height: number; width: number }[] };
          const videoStream = parsed.streams?.[0];
          if (!videoStream) {
            reject(new Error('No video stream found'));
            return;
          }
          resolve(new MetaData(videoStream.codec_name, videoStream.height, videoStream.width, byteCount));
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });

      const counter = new PassThrough();
      counter.on('data', (chunk: Buffer) => {
        byteCount += chunk.length;
      });

      input.on('error', reject);
      input.pipe(counter).pipe(ffprobe.stdin);
    });
  }

  public generateThumbnail(input: Readable): { process: ReturnType<typeof spawn>; stream: Readable } {
    const args = [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-ss',
      '00:00:02',
      '-frames:v',
      '1',
      '-vf',
      'scale=320:-1',
      '-q:v',
      '2',
      '-f',
      'image2',
      'pipe:1',
    ];

    const ffmpeg = spawn(VideoProcessor.FFMPEG_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    const output = new PassThrough();

    pipeline(input, ffmpeg.stdin, (err) => {
      if (err && err.code !== 'EPIPE') {
        logger.error('[ffmpeg] stdin pipeline error', err);
        output.destroy(err);
        ffmpeg.kill('SIGKILL');
      }
    });

    pipeline(ffmpeg.stdout, output, (err) => {
      if (err) {
        logger.error('[ffmpeg] stdout pipeline error', err);
        ffmpeg.kill('SIGKILL');
      }
    });
    ffmpeg.stderr.on('data', (d: Buffer) => {
      logger.warn(`[ffmpeg thumbnail] ${d.toString()}`);
    });

    ffmpeg.once('error', (err) => {
      output.destroy(err);
    });

    ffmpeg.once('close', (code) => {
      if (code === 0) {
        logger.info('[video] thumbnail generated');
        output.end();
      } else {
        output.destroy(new Error(`FFmpeg thumbnail failed with code ${String(code)}`));
      }
    });

    output.once('close', () => {
      if (!ffmpeg.killed) {
        ffmpeg.kill('SIGKILL');
      }
    });

    const timeout = setTimeout(() => {
      if (!ffmpeg.killed) {
        logger.error('[ffmpeg] timeout, killing process');
        ffmpeg.kill('SIGKILL');
        output.destroy(new Error('FFmpeg timeout'));
      }
    }, 15000);

    ffmpeg.once('close', () => {
      clearTimeout(timeout);
    });

    return { process: ffmpeg, stream: output };
  }

  public generateVideo(rendition: VideoRendition, input: Readable): { process: ReturnType<typeof spawn>; stream: Readable } {
    const args = [
      '-i',
      'pipe:0',
      '-vf',
      `scale=-2:${String(rendition.height)}`,
      '-c:v',
      'libx264',
      '-preset',
      'fast',
      '-crf',
      String(rendition.crf),
      '-c:a',
      'aac',
      '-b:a',
      rendition.audioBitrate,
      '-movflags',
      'frag_keyframe+empty_moov',
      '-f',
      'mp4',
      'pipe:1',
    ];

    const ffmpeg = spawn(VideoProcessor.FFMPEG_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    const output = new PassThrough();
    input.pipe(ffmpeg.stdin);
    ffmpeg.stdout.pipe(output);

    ffmpeg.stderr.on('data', (d: Buffer) => {
      logger.warn(`[ffmpeg ${rendition.label}] ${d.toString()}`);
    });

    ffmpeg.stdin.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code !== 'EPIPE') output.destroy(err);
    });

    ffmpeg.on('error', (err) => {
      output.destroy(err);
    });

    ffmpeg.on('close', (code) => {
      input.unpipe(ffmpeg.stdin);
      if (code === 0) {
        logger.info(`[video] transcoded ${rendition.label}`);
      } else {
        output.destroy(new Error(`FFmpeg transcode failed for ${rendition.label} with code ${String(code)}`));
      }
    });

    return { process: ffmpeg, stream: output };
  }

  public thumbnailKey(objectKey: string): string {
    const withoutExt = objectKey.replace(/\.[^.]+$/, '');
    return `${withoutExt}.jpg`;
  }

  public transcodedKey(objectKey: string, label: string): string {
    const withoutExt = objectKey.replace(/\.[^.]+$/, '');
    return `${withoutExt}_${label}.mp4`;
  }
}
