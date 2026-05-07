import { Router } from 'express';

import { FilterFileUseCase } from '#application/use-case/FilterFileUseCase.js';

const DEFAULT_LIMIT = 50;
const DEFAULT_OFFSET = 0;

export function createFilterRoute(filterFile: FilterFileUseCase) {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const limit = Number(req.query.limit) || DEFAULT_LIMIT;
      const offset = Number(req.query.offset) || DEFAULT_OFFSET;

      const files = await filterFile.getFiles(limit, offset);

      res.json(
        files.map((file) => ({
          bucket: file.getBucket(),
          ext: file.getExtension(),
          id: file.getId(),
          objectKey: file.getObjectKey(),
          progress: file.getProgress(),
          status: file.getStatus(),
        }))
      );
    } catch (err) {
      res.status(500).send({ Error: err });
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
