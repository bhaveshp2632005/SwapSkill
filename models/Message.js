// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },   // Store sender email
  receiver: { type: String, required: true }, // Store receiver email
  content: { type: String, required: true },
  messageType: { type: String, enum: ['text', 'call_started', 'call_ended', 'call_missed'], default: 'text' },
  callType: { type: String, enum: ['audio', 'video'], default: null },
  callDuration: { type: Number, default: 0 }, // in seconds
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
