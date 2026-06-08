import mongoose from 'mongoose';

const validationSchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ECGAnalysis',
    required: true,
    unique: true
  },
  cardiologistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  aiRhythmCorrect: { type: Boolean, required: true },
  aiAbnormalitiesCorrect: { type: Boolean, required: true },
  correctedRhythm: { type: String, trim: true },
  correctedAbnormalities: { type: [String], default: [] },
  confidenceRating: { type: Number, enum: [1, 2, 3, 4, 5] },
  notes: { type: String, trim: true, maxlength: 2000 }
}, { timestamps: true });

validationSchema.index({ cardiologistId: 1, createdAt: -1 });

export default mongoose.model('Validation', validationSchema);
