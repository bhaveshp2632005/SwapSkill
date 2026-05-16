import Message from '../models/Message.js';
import User from '../models/User.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|mp4|mp3/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

export const getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      return res.status(400).json({ message: 'user1 and user2 are required' });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort({ createdAt: 1 });

    // Mark unread messages as seen
    await Message.updateMany(
      { sender: user2, receiver: user1, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user.email;

    if (!receiver) {
      return res.status(400).json({ message: 'receiver is required' });
    }

    let messageType = 'text';
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;

    if (req.file) {
      const imageTypes = /jpeg|jpg|png|gif/;
      const isImage = imageTypes.test(path.extname(req.file.originalname).toLowerCase());
      messageType = isImage ? 'image' : 'file';
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
    }

    const message = await Message.create({
      sender,
      receiver,
      content: content || '',
      messageType,
      fileUrl,
      fileName,
      fileSize,
    });

    // Add notification for receiver
    await User.findOneAndUpdate(
      { email: receiver },
      {
        $push: {
          notifications: {
            type: 'new_message',
            from: sender,
            message: `${req.user.name} sent you a message`,
          },
        },
      }
    );

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markSeen = async (req, res) => {
  try {
    const { sender } = req.body;
    const receiver = req.user.email;

    await Message.updateMany(
      { sender, receiver, seen: false },
      { seen: true, seenAt: new Date() }
    );

    res.json({ message: 'Messages marked as seen' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
