import { Client } from 'minio';

export const minioClient = new Client({
  accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
  endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
  port: Number(process.env.MINIO_PORT) || 9000,
  secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  useSSL: false,
});
export const BUCKET = 'files';
export const THUMBNAIL_BUCKET = 'thumbnails';
export const VIDEO_BUCKET = 'videos';
