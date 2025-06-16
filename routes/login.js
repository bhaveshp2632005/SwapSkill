import express from 'express';
const router = express.Router();
import bcrypt from 'bcrypt';
import User from '../models/User.js';

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier = email or username

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) return res.status(400).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

    // success response
    res.status(200).json({ message: 'Login successful', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Change this line:
export default router;
