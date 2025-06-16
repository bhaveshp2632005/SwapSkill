import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  requester: { type: String, required: true },
  receiver: { type: String, required: true },
  requestedSkill: { type: String, required: true },
  offeredSkill: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
}, { timestamps: true });

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
