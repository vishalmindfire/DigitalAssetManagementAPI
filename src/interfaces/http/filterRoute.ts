import { Router } from 'express';

import { FilterFileUseCase } from '#application/use-case/FilterFileUseCase.js';
import { checkAuth } from '#infrastructure/middlewares/auth.js';

const DEFAULT_LIMIT = 50;

export function createFilterRoute(filterFile: FilterFileUseCase) {
  const router = Router();

  router.get('/', checkAuth, async (req, res) => {
    try {
      const limit = Number(req.query.limit) || DEFAULT_LIMIT;

      const userId = req.user?.id;
      const role = req.user?.role;
      const fileId = req.query.fileid as string;
      const createDate = req.query.createdate as string;
      let cursorInfo = null;

      if (!userId || !role) {
        return res.status(401).send('Not authenticated');
      }
      if (fileId && createDate) {
        cursorInfo = {
          fileId: req.query.fileid as string,
          createDate: new Date(req.query.createdate as string),
        };
      }
      const files = await filterFile.getFiles(userId, cursorInfo, limit, role);

      res.status(200).json({
        files:
          files.files !== null
            ? files.files.map((file) => {
                return {
                  bucket: file.getBucket(),
                  ext: file.getExtension(),
                  id: file.getId(),
                  objectKey: file.getObjectKey(),
                  progress: file.getProgress(),
                  status: file.getStatus(),
                  name: file.getObjectKey(),
                  size: file.getSize(),
                  mimeType: file.getMimeType(),
                  createdDate: file.getCreatedDate(),
                  uploadDate: file.getCreatedDate(),
                  userId: file.getUserId(),
                };
              })
            : null,
        nextCursor: files.nextCursor,
      });
    } catch (err) {
      res.status(500).send({ Error: err });
    }
  });

  router.patch('/:id', checkAuth, async (req, res) => {
    try {
      const { status } = req.body as { status: string };
      const id = req.params.id as string;
      if (!id || !status) {
        return res.status(400).json({ message: 'id and status are required' });
      }

      await filterFile.updateFileStatus(id, status);
      res.status(200).json({ message: 'File status updated' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      res.status(400).json({ message });
    }
  });

  router.get('/tag/:tag', async (req, res) => {
    try {
      const files = await filterFile.filterByTag(req.params.tag);

      if (files.length === 0) {
        return res.status(404).json({ message: 'No files found for tag' });
      }

      res.json(
        files.map((file) => ({
          bucket: file.getBucket(),
          ext: file.getExtension(),
          id: file.getId(),
          objectKey: file.getObjectKey(),
          status: file.getStatus(),
        }))
      );
    } catch (err) {
      res.status(500).send({ Error: err });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const file = await filterFile.filterById(req.params.id);

      if (!file) {
        return res.status(404).json({ message: 'File not found' });
      }

      res.json({
        bucket: file.getBucket(),
        createdDate: file.getCreatedDate(),
        ext: file.getExtension(),
        id: file.getId(),
        objectKey: file.getObjectKey(),
        progress: file.getProgress(),
        status: file.getStatus(),
        updatedDate: file.getUpdatedDate(),
      });
    } catch (err) {
      res.status(500).send({ Error: err });
    }
  });

  return router;
}
