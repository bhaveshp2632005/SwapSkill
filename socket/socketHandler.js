import Message from '../models/Message.js';
import User from '../models/User.js';

// Map: email -> Set of socketIds
const onlineUsers = new Map();

const addUser = (email, socketId) => {
  if (!onlineUsers.has(email)) {
    onlineUsers.set(email, new Set());
  }
  onlineUsers.get(email).add(socketId);
};

const removeUser = (email, socketId) => {
  if (onlineUsers.has(email)) {
    onlineUsers.get(email).delete(socketId);
    if (onlineUsers.get(email).size === 0) {
      onlineUsers.delete(email);
    }
  }
};

const isOnline = (email) => onlineUsers.has(email) && onlineUsers.get(email).size > 0;

const getOnlineUsers = () => [...onlineUsers.keys()];

export const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    // User comes online
    socket.on('user:online', async (email) => {
      if (!email) return;
      socket.userEmail = email;
      socket.join(email);
      addUser(email, socket.id);

      await User.findOneAndUpdate(
        { email },
        { isOnline: true, lastSeen: new Date() }
      );

      io.emit('users:online', getOnlineUsers());
      console.log(`👤 ${email} is online`);
    });

    // Fetch online users list
    socket.on('users:get_online', () => {
      socket.emit('users:online', getOnlineUsers());
    });

    // Real-time message
    socket.on('message:send', async (data) => {
      try {
        const { sender, receiver, content, messageType = 'text', tempId } = data;

        if (!sender || !receiver || (!content && messageType === 'text')) return;

        const message = await Message.create({
          sender,
          receiver,
          content: content || '',
          messageType,
          seen: isOnline(receiver),
          seenAt: isOnline(receiver) ? new Date() : null,
        });

        const msgObj = message.toObject();

        // Send to both parties
        io.to(receiver).emit('message:receive', { ...msgObj, tempId });
        io.to(sender).emit('message:receive', { ...msgObj, tempId });

        // Notify receiver if not in same chat
        if (isOnline(receiver)) {
          io.to(receiver).emit('notification:message', {
            from: sender,
            message: content,
            messageId: message._id,
          });
        }
      } catch (err) {
        console.error('Socket message error:', err);
        socket.emit('message:error', { error: err.message });
      }
    });

    // Typing indicators
    socket.on('typing:start', ({ sender, receiver }) => {
      if (receiver) io.to(receiver).emit('typing:start', sender);
    });

    socket.on('typing:stop', ({ sender, receiver }) => {
      if (receiver) io.to(receiver).emit('typing:stop', sender);
    });

    // Mark messages as seen
    socket.on('message:seen', async ({ sender, receiver }) => {
      try {
        await Message.updateMany(
          { sender, receiver, seen: false },
          { seen: true, seenAt: new Date() }
        );
        io.to(sender).emit('message:seen_ack', { receiver });
      } catch (err) {
        console.error('Seen update error:', err);
      }
    });

    // WebRTC signaling
    socket.on('call:initiate', ({ caller, callee, callType, offer }) => {
      io.to(callee).emit('call:incoming', { caller, callType, offer });
    });

    socket.on('call:answer', ({ caller, callee, answer }) => {
      io.to(caller).emit('call:answered', { answer, from: callee });
    });

    socket.on('call:reject', ({ caller, callee }) => {
      io.to(caller).emit('call:rejected', { by: callee });
    });

    socket.on('call:end', ({ from, to }) => {
      io.to(to).emit('call:ended', { by: from });
      io.to(from).emit('call:ended', { by: from });
    });

    socket.on('ice:candidate', ({ to, candidate }) => {
      io.to(to).emit('ice:candidate', { from: socket.userEmail, candidate });
    });

    // Connection request notification
    socket.on('notification:connection_request', ({ to, from, name }) => {
      io.to(to).emit('notification:connection_request', {
        from,
        message: `${name} wants to connect with you`,
      });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const email = socket.userEmail;
      if (email) {
        removeUser(email, socket.id);

        if (!isOnline(email)) {
          await User.findOneAndUpdate(
            { email },
            { isOnline: false, lastSeen: new Date() }
          );
          io.emit('users:online', getOnlineUsers());
          console.log(`🔴 ${email} went offline`);
        }
      }
    });
  });
};
