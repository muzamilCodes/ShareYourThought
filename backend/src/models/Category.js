import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    accent: { type: String, default: 'neutral' },
    thoughtCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
