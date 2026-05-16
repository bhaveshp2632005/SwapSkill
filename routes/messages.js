import express from 'express';
import {
  getMessages,
  sendMessage,
  markSeen,
  upload,
} from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getMessages);
router.post('/send', protect, upload.single('file'), sendMessage);
router.put('/seen', protect, markSeen);

export default router;
