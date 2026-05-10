import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express';

import express from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { UploadFileUseCase } from '#application/use-case/UploadFileUseCase.js';
import { BUCKET, minioClient, THUMBNAIL_BUCKET, VIDEO_BUCKET } from '#configs/minioConfig.js';
import { pgPool } from '#configs/postgresConfig.js';
import { logger } from '#infrastructure/logging/winstonLogger.js';
import { PostgresFileRepository } from '#infrastructure/persistence/PostgresFileRepository.js';
import { MinioStorage } from '#infrastructure/storage/minioStorage.js';
import { createUploadRoute } from '#interfaces/http/uploadRoute.js';
import { createFilterRoute } from '#interfaces/http/filterRoute.js';
import { createUserRoute } from '#interfaces/http/userRoute.js';
import { PostgresFileTagsRepository } from '#infrastructure/persistence/PostgresFileTags.js';
import { PostgresUserRepository } from '#infrastructure/persistence/PostgresUserRepository.js';
import { FilterFileUseCase } from '#application/use-case/FilterFileUseCase.js';
import { corsMiddleware } from '#infrastructure/middlewares/cors.js';

const app = express();
app.set('trust proxy', true);
app.use(helmet());
app.use(corsMiddleware);
app.use(cookieParser());
app.use(express.json());
const httpPort = process.env.HTTPS_PORT ?? '3000';

const storage = new MinioStorage(minioClient, BUCKET, THUMBNAIL_BUCKET, VIDEO_BUCKET);
const fileRepo = new PostgresFileRepository(pgPool);
const fileTagRepo = new PostgresFileTagsRepository(pgPool);
const uploadFile = new UploadFileUseCase(fileRepo, fileTagRepo, storage);
const filterFile = new FilterFileUseCase(fileRepo, fileTagRepo);

app.use(morgan('combined'));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'App running',
  });
});

app.use('/upload', createUploadRoute(uploadFile));
app.use('/files', createFilterRoute(filterFile));
app.use('/users', createUserRoute(new PostgresUserRepository(pgPool)));
const errorHandler: ErrorRequestHandler = (err: Error, _req, res, _next: NextFunction) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error('Unhandled error', { error: message });
  res.status(500).json({ message });
};
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  if (process.env.NODE_ENV === 'production') {
    const server = http.createServer(app);
    server.listen(httpPort);
  } else {
    const certPath = process.env.CERTIFICATE;
    if (!certPath) throw new Error('Missing environment variable: CERTIFICATE');
    const httpsOptions = {
      passphrase: process.env.CERTIFICATE_PASS,
      pfx: fs.readFileSync(certPath),
    };
    const server = https.createServer(httpsOptions, app);
    server.listen(httpPort);
  }
}

export default app;
