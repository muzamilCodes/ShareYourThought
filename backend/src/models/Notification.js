import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['follow', 'follow_request', 'like', 'comment', 'reply', 'system'], required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'none'], default: 'none' },
    title: { type: String, required: true },
    body: { type: String, required: true },
    thought: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought', default: null },
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
