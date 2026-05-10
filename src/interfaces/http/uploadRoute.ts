import { Request, Response, Router } from 'express';
import { checkAuth } from '#infrastructure/middlewares/auth.js';

import { UploadFileUseCase } from '#application/use-case/UploadFileUseCase.js';

export function createUploadRoute(uploadFile: UploadFileUseCase) {
  const router = Router();

  router.post('/', checkAuth, async (req: Request, res: Response) => {
    try {
      const { name, mimeType, size } = req.body as { name: string; mimeType: string; size: number };
      const userId = req.user?.id;

      if (!name) {
        return res.status(400).send('No file');
      }
      if (!userId) {
        return res.status(401).send('Not authenticated');
      }

      const created = await uploadFile.execute(name, mimeType, size, userId);

      res.status(200).json({
        id: created.getId(),
        name: created.getObjectKey(),
        size: created.getSize(),
        mimeType: created.getMimeType(),
        status: created.getStatus(),
        progress: created.getProgress(),
        objectKey: created.getObjectKey(),
        createDate: created.getCreatedDate(),
        url: created.url,
      });
    } catch (err) {
      res.status(500).send({ Error: err });
    }
  });

  return router;
}
