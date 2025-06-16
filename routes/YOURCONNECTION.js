import express from 'express';
import Connection from '../models/Connection.js';

const router = express.Router();

// ✅ GET accepted requests for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const acceptedRequests = await Connection.find({
      receiver: userId,
      status: 'accepted', // ✅ Fixed typo here
    }).populate('requester', 'email');

    res.status(200).json(acceptedRequests);
  } catch (error) {
    console.error('❌ Error fetching accepted requests:', error);
    res.status(500).json({ message: 'Failed to load accepted requests' });
  }
});

export default router;
