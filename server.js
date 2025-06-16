import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server as SocketIO } from 'socket.io';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// 🔑 Environment Variables
const apiKey = process.env.GOOGLE_API_KEY;
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// 🔌 Google AI Setup
const genAI = new GoogleGenerativeAI(apiKey);

// 🧠 Models
import Message from './models/Message.js';
import User from './models/User.js';

// 🧩 Routes
import loginRouter from './routes/login.js';
import SignupRouter from './routes/Signup.js';
import allconnectionrequest from './routes/allconnectionrequest.js';
import connectionRoutes from './routes/connecction.js';
import requestHandel from './routes/ConnectionRoutes.js';
import yourconnection from './routes/YOURCONNECTION.js';
import acceptORrejectRoutes from './routes/acceptORreject.js';
import skillsRoutes from './routes/skills.js';

// 🚀 Express Setup
const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, { cors: { origin: "*" } });

// 🧰 Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// 🌐 MongoDB Connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// 🔌 Socket.IO Events
io.on('connection', (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on('join', (email) => {
    socket.join(email);
    console.log(`👥 ${email} joined room`);
  });

  socket.on('send_message', async (data) => {
    try {
      const message = new Message({
        sender: data.sender,
        receiver: data.receiver,
        content: data.content,
        timestamp: new Date()
      });
      await message.save();

      socket.to(data.receiver).emit('receive_message', message);
      socket.emit('receive_message', message);
    } catch (err) {
      console.error("❌ Error handling message:", err);
    }
  });

  socket.on('register-user', (email) => {
    socket.join(email);
    console.log(`📲 Registered for video calls: ${email}`);
  });

  socket.on('video-call', ({ to, offer }) => {
    console.log(`📞 Offer sent from ${socket.id} to ${to}`);
    socket.to(to).emit('video-call', { from: socket.id, offer });
  });

  socket.on('answer-call', ({ to, answer }) => {
    console.log(`✅ Answer sent from ${socket.id} to ${to}`);
    socket.to(to).emit('call-answered', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    console.log(`🧊 ICE Candidate from ${socket.id} to ${to}`);
    socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  socket.on('disconnect', () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// 🛣️ API Routes
app.use('/api', loginRouter);
app.use('/api', SignupRouter);
app.use('/api/acceptORreject', acceptORrejectRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/requests', requestHandel);
app.use('/api/allrequest', allconnectionrequest);
app.use('/api/allconnection', yourconnection);
app.use('/api/skills', skillsRoutes);

// 💬 Get Messages
app.get('/api/messages', async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error while fetching messages' });
  }
});

// 🤖 AI Buddy (Gemini)
app.post('/api/aibuddy', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `You are a highly knowledgeable and friendly AI assistant named SkillBuddy.\n\nYour role is to help users with:\n- Learning new skills\n- Career advice\n- Technical questions\n- Personalized learning roadmaps\n\nUser's question:\n"${prompt}".`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const ans = await response.text();

    res.json({ ans });
  } catch (error) {
    console.error('❌ AI Error:', error);
    res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// 👤 Get Profile
app.get('/api/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔍 Search Users
app.get('/search', async (req, res) => {
  const q = req.query.q?.trim();
  if (!q) return res.status(400).json({ message: "Query parameter 'q' is required" });

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { skills: { $elemMatch: { $regex: q, $options: 'i' } } },
      ],
    });
    res.json(users);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// 👥 All Users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🌐 Root Route
app.get('/', (req, res) => res.send('🚀 SkillSwap API is running'));

// 🟢 Start Server
server.listen(PORT, () => console.log(`🌐 Server running at http://localhost:${PORT}`));
