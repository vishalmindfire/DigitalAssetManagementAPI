import express from 'express';
import http from 'http';

const app = express();
const httpPort = process.env.HTTP_PORT ?? '3000';
const server = http.createServer(app);
server.listen(httpPort, () => {
  console.log(`HTTP server listening on port ${httpPort}`);
});
