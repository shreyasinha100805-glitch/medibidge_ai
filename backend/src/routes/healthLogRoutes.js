import express from 'express';
import { createHealthLog, getHealthLogs } from '../controllers/healthLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getHealthLogs);
router.post('/', createHealthLog);

export default router;
