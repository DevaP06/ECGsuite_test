import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['diagnosis', 'review', 'alert'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  link: {
    type: String,
    trim: true,
  },
  sourceType: {
    type: String,
    enum: ['ECG_ANALYSIS', 'SPECIALIST_REVIEW'],
    default: null,
  },
  sourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  read: {
    type: Boolean,
    default: false,
  },
  dismissed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true, versionKey: false });

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, dismissed: 1 });

export default mongoose.model('Notification', notificationSchema);
