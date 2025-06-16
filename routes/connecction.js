import express from 'express';
import Connection from '../models/Connection.js';

const router = express.Router();

router.post('/request', async (req, res) => {
  try {
    const { requester, receiver, requestedSkill, offeredSkill } = req.body;

    if (!requester || !receiver || !requestedSkill || !offeredSkill) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newConnection = new Connection({
      requester,
      receiver,
      requestedSkill,
      offeredSkill,
      status: 'pending'
    });

    await newConnection.save();
    res.status(201).json({ message: "Connection request sent successfully" });

  } catch (error) {
    console.error("❌ Error in connection request:", error);
    res.status(500).json({ message: "Server error while sending request" });
  }
});

export default router;
