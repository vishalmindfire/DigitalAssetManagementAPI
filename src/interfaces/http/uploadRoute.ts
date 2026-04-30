// interfaces/http/uploadRoute.ts
import { Router } from 'express';
import multer from 'multer';

import { UploadFileUseCase } from '#application/use-case/UploadFileUseCase.js';

export function createUploadRoute(uploadFile: UploadFileUseCase) {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  router.post('/', upload.array('files'), async (req, res) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).send('No file');
      }

      const created = await Promise.all(
        (req.files as Express.Multer.File[]).map((newFile: Express.Multer.File) =>
          uploadFile.execute(newFile.originalname, newFile.mimetype, newFile.buffer)
        )
      );

      res.json(
        created.map((file) => ({
          id: file.id.value,
          status: file.status.getValue(),
        }))
      );
    } catch (err) {
      res.status(500).send({ Error: err });
    }
  });

  return router;
}
