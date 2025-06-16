import express from 'express';
import Connection from '../models/Connection.js';

const router = express.Router();

// GET pending requests for a user
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId; // ✅ Use query param

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const pendingRequests = await Connection.find({
      receiver: userId,
      status: 'pending',
    }).populate('requester', 'email');

    res.status(200).json(pendingRequests);
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({ message: 'Failed to load pending requests' });
  }
});

export default router;
