import express from 'express';
import { getDrafts, createDraft, updateDraft, deleteDraft } from '../controllers/draftController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getDrafts)
  .post(createDraft);

router.route('/:id')
  .patch(updateDraft)
  .delete(deleteDraft);

export default router;
