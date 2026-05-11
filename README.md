# Digital Asset Management API

REST API for uploading and managing digital assets with presigned URL upload, JWT auth, tag filtering, and async media processing.

## Tech Stack

- Node.js 24, TypeScript, Express 5
- PostgreSQL, MinIO, RabbitMQ
- Sharp (images), FFmpeg (videos)
- JWT (cookie-based auth), bcryptjs, Winston

## Project Structure

src/
application/use-case/ business logic
domain/ entities, repositories, value-objects
infrastructure/ postgres, minio, rabbitmq, middlewares
interfaces/http/ express routes

## Prerequisites

- Node.js 24, PostgreSQL 16, MinIO, RabbitMQ, FFmpeg

## Setup

npm install
cp .env.development .env.local
psql -U postgres -d DAM -f dataset/01_tables.sql
npm run dev
npm run dev:worker # asset processing worker

## Environment Variables

HTTPS_PORT server port (default 3000)
CERTIFICATE path to PFX certificate
CERTIFICATE_PASS PFX passphrase
DB_HOST postgres host
DB_PORT postgres port
DB_NAME postgres database
DB_USER postgres user
DB_PASSWORD postgres password
JWT_SECRET JWT signing secret
MINIO_ENDPOINT minio host
MINIO_PORT minio port
MINIO_ACCESS_KEY minio access key
MINIO_SECRET_KEY minio secret key
RABBITMQ_URL rabbitmq connection url
FFMPEG_PATH path to ffmpeg binary

## API

### Auth /users

POST /users/login login, sets JWT cookie
POST /users/logout clears JWT cookie
POST /users/checkAuth verify session, return profile

### Upload /upload

POST /upload register file, returns presigned PUT url

Body: { name, mimeType, size }

Use the returned `url` to PUT the file directly to MinIO. The worker processes it via RabbitMQ.

### Files /files

GET /files list files, cursor paginated
PATCH /files/:id update file status
GET /files/tag/:tag filter by tag
GET /files/:id get file by id

List query params: limit, fileid, createdate (cursor).
Admins see all files; users see only their own.

PATCH body: { status } — valid transitions: PENDING to PROCESSING to COMPLETED or FAILED.

## File Status

PENDING -> PROCESSING -> COMPLETED OR FAILED

## Scripts

npm run dev - start dev server
npm run dev:worker - start processing worker
npm run build - compile to dist/
npm start - run production build
npm start:worker - run worker from production build
npm test run - tests
npm run lint:fix - lint and auto-fix
npm run type-check - typecheck without emit
