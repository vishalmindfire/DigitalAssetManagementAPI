import { Pool } from 'pg';

import { logger } from '#infrastructure/logging/winstonLogger.js';

export const pgPool = new Pool({
  database: process.env.DB_NAME ?? 'dam',
  host: process.env.DB_HOST ?? 'localhost',
  password: process.env.DB_PASSWORD ?? 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER ?? 'postgres',
});

void (async () => {
  try {
    const client = await pgPool.connect();
    logger.info('Connected to PostgreSQL database');
    client.release();
  } catch (error: unknown) {
    logger.error('Error connecting to the database:', error);
  }
})();
