import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ── Avatar upload config ──────────────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars/';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  },
});

// ── Controllers ───────────────────────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, bio, image } = req.body;

    // File upload takes priority over URL string
    const imageUrl = req.file
      ? `/uploads/avatars/${req.file.filename}`
      : image;

    // Delete old local avatar when a new file is uploaded
    if (req.file) {
      const existing = await User.findById(req.user._id);
      if (existing?.image?.startsWith('/uploads/avatars/')) {
        const oldPath = '.' + existing.image;
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, image: imageUrl },
      { new: true, runValidators: true }
    );

    res.json(updated.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/avatars/${req.file.filename}`;

    // Delete old local avatar
    const existing = await User.findById(req.user._id);
    if (existing?.image?.startsWith('/uploads/avatars/')) {
      const oldPath = '.' + existing.image;
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { image: imageUrl },
      { new: true }
    );

    res.json({ image: imageUrl, user: updated.toJSON() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users.map((u) => u.toJSON()));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { skills: { $elemMatch: { $regex: q, $options: 'i' } } },
        { neededSkills: { $elemMatch: { $regex: q, $options: 'i' } } },
      ],
    });

    res.json(users.map((u) => u.toJSON()));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const addSkill = async (req, res) => {
  try {
    const { skill, type } = req.body;

    if (!skill || !['skills', 'neededSkills'].includes(type)) {
      return res.status(400).json({ message: 'Invalid skill or type' });
    }

    const user = await User.findById(req.user._id);
    if (user[type].includes(skill)) {
      return res.status(409).json({ message: 'Skill already exists' });
    }

    user[type].push(skill.trim());
    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const removeSkill = async (req, res) => {
  try {
    const { skill, type } = req.body;

    if (!skill || !['skills', 'neededSkills'].includes(type)) {
      return res.status(400).json({ message: 'Invalid skill or type' });
    }

    const user = await User.findById(req.user._id);

    if (type === 'skills' && user.skills.length <= 1) {
      return res.status(400).json({ message: 'Cannot remove the last skill' });
    }

    user[type] = user[type].filter((s) => s !== skill);
    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateSkill = async (req, res) => {
  try {
    const { oldSkill, newSkill, type } = req.body;

    if (!oldSkill || !newSkill || !['skills', 'neededSkills'].includes(type)) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    const user = await User.findById(req.user._id);
    const idx = user[type].indexOf(oldSkill);

    if (idx === -1) return res.status(404).json({ message: 'Skill not found' });
    if (user[type].includes(newSkill)) return res.status(409).json({ message: 'Skill already exists' });

    user[type][idx] = newSkill.trim();
    await user.save();
    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notifications = user.notifications.sort((a, b) => b.createdAt - a.createdAt);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $set: { 'notifications.$[].read': true },
    });
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
