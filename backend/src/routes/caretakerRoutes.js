import express from 'express';
import {
  sendConnectionRequest,
  getRequests,
  respondToRequest,
  getMyPatients,
  getMyCaretakers,
  getPatientDashboardForCaretaker,
  getPatientAdherenceForCaretaker,
} from '../controllers/caretakerController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/connect', sendConnectionRequest);
router.get('/requests', getRequests);
router.patch('/requests/:id', respondToRequest);

router.get('/patients', authorize('CARETAKER'), getMyPatients);
router.get('/caretakers', authorize('PATIENT'), getMyCaretakers);

router.get('/patients/:patientId/dashboard', authorize('CARETAKER'), getPatientDashboardForCaretaker);
router.get('/patients/:patientId/adherence', authorize('CARETAKER'), getPatientAdherenceForCaretaker);

export default router;
