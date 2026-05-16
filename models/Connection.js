import mongoose from 'mongoose';

const ConnectionSchema = new mongoose.Schema(
  {
    requester: { type: String, required: true }, // email
    receiver: { type: String, required: true },  // email
    requestedSkill: { type: String, required: true },
    offeredSkill: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

ConnectionSchema.index({ requester: 1, receiver: 1 }, { unique: true });

const Connection = mongoose.model('Connection', ConnectionSchema);
export default Connection;
