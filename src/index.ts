import type { Request, Response } from 'express';

import express from 'express';
import http from 'http';

const app = express();
const httpPort = process.env.HTTP_PORT ?? '3000';

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'App running',
  });
});
if (process.env.NODE_ENV !== 'test') {
  const server = http.createServer(app);
  server.listen(httpPort, () => {
    console.log(`HTTP server listening on port ${httpPort}`);
  });
}

export default app;
