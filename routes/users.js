import express from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getAllUsers,
  searchUsers,
  addSkill,
  removeSkill,
  updateSkill,
  getNotifications,
  markNotificationsRead,
  avatarUpload,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/all', protect, getAllUsers);
router.get('/search', protect, searchUsers);
router.get('/profile/:email', protect, getProfile);

// Profile update — accepts optional file upload for avatar
router.put('/profile', protect, avatarUpload.single('avatar'), updateProfile);

// Dedicated avatar-only upload endpoint
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

router.post('/skills/add', protect, addSkill);
router.delete('/skills/remove', protect, removeSkill);
router.put('/skills/update', protect, updateSkill);

router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

export default router;
