import type { Request, Response } from 'express';

import express from 'express';
import http from 'http';
import morgan from 'morgan';

import { UploadFileUseCase } from '#application/use-case/UploadFileUseCase.js';
import { BUCKET, minioClient, THUMBNAIL_BUCKET, VIDEO_BUCKET } from '#configs/minioConfig.js';
import { pgPool } from '#configs/postgresConfig.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
import { PostgresFileRepository } from '#infrastructure/persistence/PostgresFileRepository.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';
import { createUploadRoute } from '#interfaces/http/uploadRoute.js';
import { PostgresFileTagsRepository } from '#infrastructure/persistence/PostgresFileTags.js';

const app = express();
const httpPort = process.env.HTTP_PORT ?? '3000';

const storage = new MinioStorage(minioClient, BUCKET, THUMBNAIL_BUCKET, VIDEO_BUCKET);
const fileRepo = new PostgresFileRepository(pgPool);
const fileTagRepo = new PostgresFileTagsRepository(pgPool);
const uploadFile = new UploadFileUseCase(fileRepo, fileTagRepo, storage);

app.use(morgan('combined'));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'App running',
  });
});

app.use('/upload', createUploadRoute(uploadFile));

app.use((err: Error, req: Request, res: Response) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).send('Error');
});

if (process.env.NODE_ENV !== 'test') {
  const server = http.createServer(app);
  server.listen(httpPort);
}

export default app;
