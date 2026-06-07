import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: { type: String, required: true, trim: true },
  value: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const patientHistorySchema = new mongoose.Schema({
  analysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ECGAnalysis',
    required: true,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSchema],
  questionnaireVersion: {
    type: String,
    default: 'v1'
  }
}, {
  timestamps: true
});

patientHistorySchema.index({ patientId: 1, createdAt: -1 });

export default mongoose.model('PatientHistory', patientHistorySchema);
