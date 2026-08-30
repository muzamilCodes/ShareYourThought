import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    imageUrl: {
      type: String,
      default: ''
    },
    category: {
      type: String,
      default: 'Life',
      trim: true
    },
    hashtags: {
      type: String,
      default: ''
    },
    isStory: {
      type: Boolean,
      default: false
    },
    gradient: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('Draft', draftSchema);
