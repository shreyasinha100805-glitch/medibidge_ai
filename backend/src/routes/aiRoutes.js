import express from 'express';
import { askAssistant, getAIHistory } from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, authorize('PATIENT'));

router.post('/assistant', askAssistant);
router.get('/history', getAIHistory);

export default router;
