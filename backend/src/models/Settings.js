import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light',
    },
    density: {
      type: String,
      enum: ['comfortable', 'compact'],
      default: 'comfortable',
    },
  },
  notifications: {
    diagnosisUpdates: { type: Boolean, default: true },
    reviewUpdates: { type: Boolean, default: true },
    emergencyAlerts: { type: Boolean, default: true },
    emailDigest: { type: Boolean, default: false },
  },
  privacy: {
    shareAnonymizedDataForResearch: { type: Boolean, default: false },
  },
}, { timestamps: true, versionKey: false });

export default mongoose.model('Settings', settingsSchema);
