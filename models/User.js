import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skills: {
    type: [String],
    required: true,
    validate: [arrayLimit, 'At least one skill is required.']
  },
  neededSkills: {
    type: [String],
    required: true,
  },
  rating: { type: Number, default: 0 },
  bio: { type: String },
  image: { type: String },
}, { timestamps: true });

function arrayLimit(val) {
  return val.length > 0;
}

const User = mongoose.model('User', UserSchema);
export default User