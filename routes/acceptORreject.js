import express from 'express';
import Connection from '../models/Connection.js';

const router = express.Router();

// Accept request by connection ID
router.put('/accept/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const updated = await Connection.findByIdAndUpdate(
      connectionId,
      { status: 'accepted' },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Connection not found or already processed' });

    res.status(200).json({ message: 'Connection accepted', connection: updated });
  } catch (err) {
    console.error('Error accepting request:', err);
    res.status(500).json({ message: 'Failed to accept request' });
  }
});

// Reject request by connection ID
router.put('/reject/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const updated = await Connection.findByIdAndDelete(
      connectionId,
      { status: 'rejected' },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Connection not found or already processed' });

    res.status(200).json({ message: 'Connection rejected', connection: updated });
  } catch (err) {
    console.error('Error rejecting request:', err);
    res.status(500).json({ message: 'Failed to reject request' });
  }
});

export default router;
