import { Pool } from 'pg';

export const pgPool = new Pool({
  database: process.env.DB_NAME ?? 'dam',
  host: process.env.DB_HOST ?? 'localhost',
  password: process.env.DB_PASSWORD ?? 'postgres',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER ?? 'postgres',
});

//console.log(pgPool);
