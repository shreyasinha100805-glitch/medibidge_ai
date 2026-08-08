import express from 'express';
import {
  markTaken,
  markMissed,
  getToday,
  getHistory,
  getAdherence,
} from '../controllers/medicationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('PATIENT'));

router.get('/today', getToday);
router.get('/history', getHistory);
router.get('/adherence', getAdherence);
router.post('/:id/taken', markTaken);
router.post('/:id/missed', markMissed);

export default router;