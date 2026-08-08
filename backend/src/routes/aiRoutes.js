import express from 'express';
import { askAssistant, getAIHistory, scanPrescription } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('PATIENT'));

router.post('/assistant', askAssistant);
router.get('/history', getAIHistory);
router.post('/scan-prescription', scanPrescription);

export default router;
