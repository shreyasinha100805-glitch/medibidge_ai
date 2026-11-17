import express from 'express';
import { createAuditLog, getAuditLogs } from '../controllers/auditLogController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getAuditLogs);
router.post('/', createAuditLog);

export default router;
