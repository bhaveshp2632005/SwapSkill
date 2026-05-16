import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import User from '../models/User.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Multer for signup avatar ──────────────────────────────────────────────────
const signupAvatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-signup-${Date.now()}${ext}`);
  },
});

export const signupAvatarUpload = multer({
  storage: signupAvatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  },
});

// ── Signup ────────────────────────────────────────────────────────────────────
export const signup = async (req, res) => {
  try {
    const { name, email, password, bio } = req.body;

    // Skills may arrive as repeated fields (skills[]) or a comma-separated string
    let skills = req.body['skills[]'] || req.body.skills || [];
    let neededSkills = req.body['neededSkills[]'] || req.body.neededSkills || [];

    if (typeof skills === 'string') {
      skills = skills.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(skills)) skills = [skills].filter(Boolean);

    if (typeof neededSkills === 'string') {
      neededSkills = neededSkills.split(',').map((s) => s.trim()).filter(Boolean);
    }
    if (!Array.isArray(neededSkills)) neededSkills = [neededSkills].filter(Boolean);

    if (!name || !email || !password || skills.length === 0) {
      return res.status(400).json({ message: 'Name, email, password, and at least one skill are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const imageUrl = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : (req.body.image || '');

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      skills,
      neededSkills,
      bio: bio?.trim() || '',
      image: imageUrl,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { name: identifier },
      ],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// ── Get current user ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
