import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 40 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 8, select: false },
    bio: { type: String, default: 'Thinking in public.' },
    avatar: { type: String, default: '' },
    website: { type: String, default: '' },
    location: { type: String, default: '' },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    savedThoughts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thought' }],
    isPrivate: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.index({ name: 'text', username: 'text', bio: 'text' });

export default mongoose.model('User', userSchema);
