import express from 'express';
import {

  respondToRequest,
  getMyConnections
} from '../Controller/connectionController.js';

const router = express.Router();


router.post('/respond', respondToRequest);
router.get('/:userId', getMyConnections);

export default router;
