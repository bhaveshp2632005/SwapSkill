import express from 'express';
import {
  sendRequest,
  getPendingRequests,
  getAcceptedConnections,
  respondToRequest,
  acceptRequest,
  rejectRequest,
} from '../controllers/connectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/request', protect, sendRequest);
router.get('/pending', protect, getPendingRequests);
router.get('/accepted', protect, getAcceptedConnections);
router.post('/respond', protect, respondToRequest);
router.put('/accept/:id', protect, acceptRequest);
router.put('/reject/:id', protect, rejectRequest);

export default router;
