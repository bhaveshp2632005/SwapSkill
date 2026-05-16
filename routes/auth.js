import express from 'express';
import { signup, login, getMe, signupAvatarUpload } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Signup accepts optional avatar file
router.post('/signup', signupAvatarUpload.single('avatar'), signup);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
