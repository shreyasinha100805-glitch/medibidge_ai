import express from 'express';
import {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} from '../controllers/medicineController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// All medicine routes require a logged-in PATIENT (caretakers view
// medicines via /api/caretaker/patient/:id routes instead, built later).
router.use(protect, authorize('PATIENT'));

router.route('/')
  .post(createMedicine)
  .get(getMedicines);

router.route('/:id')
  .get(getMedicineById)
  .put(updateMedicine)
  .delete(deleteMedicine);

export default router;