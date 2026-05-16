import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },   // email
    receiver: { type: String, required: true }, // email
    content: { type: String, default: '' },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image', 'call_started', 'call_ended', 'call_missed'],
      default: 'text',
    },
    fileUrl: { type: String, default: null },
    fileName: { type: String, default: null },
    fileSize: { type: Number, default: null },
    seen: { type: Boolean, default: false },
    seenAt: { type: Date, default: null },
    callType: { type: String, enum: ['audio', 'video', null], default: null },
    callDuration: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', MessageSchema);
export default Message;
