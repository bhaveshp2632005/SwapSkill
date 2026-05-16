import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    bio: { type: String, default: '' },
    image: { type: String, default: '' },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one skill is required.',
      },
    },
    neededSkills: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    notifications: [
      {
        type: { type: String, enum: ['connection_request', 'connection_accepted', 'new_message'] },
        from: { type: String },
        message: { type: String },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', UserSchema);
export default User;
