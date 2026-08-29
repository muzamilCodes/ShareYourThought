import mongoose from 'mongoose';

const thoughtSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 600 },
    imageUrl: { type: String, default: '' },
    category: { type: String, required: true, trim: true, lowercase: true },
    hashtags: [{ type: String, trim: true, lowercase: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sharesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    visibility: { type: String, enum: ['public', 'followers'], default: 'public' }
  },
  { timestamps: true }
);

thoughtSchema.index({ content: 'text', hashtags: 'text' });

export default mongoose.model('Thought', thoughtSchema);
