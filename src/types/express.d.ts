declare global {
  namespace Express {
    interface MulterFile {
      buffer: Buffer;
      destination: string;
      encoding: string;
      fieldname: string;
      filename: string;
      mimetype: string;
      originalname: string;
      path: string;
      size: number;
    }

    interface Request {
      user?: { email: string; id: number };
    }
  }
}

export {};
