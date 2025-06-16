import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const {
    username,
    email,
    password,
    skills,
    neededSkills,
    experience,
    profileImageUrl
  } = req.body;

  if (!username || !email || !password || !skills || !neededSkills) {
    return res.status(400).json({ message: 'Please fill all required fields' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: username,
      email,
      password: hashedPassword,
      skills,
      neededSkills,
      bio: experience,
      image: profileImageUrl
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully', userId: newUser._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
