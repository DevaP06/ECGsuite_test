import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema({
  rhythm: {
    type: String,
    enum: ['normal', 'atrial_fibrillation', 'atrial_flutter', 'ventricular_tachycardia', 'bradycardia', 'other'],
    default: 'normal'
  },
  heartRate: {
    type: Number,
    min: 0,
    max: 300
  },
  qrsDuration: {
    type: Number,
    min: 0,
    max: 200
  },
  qtInterval: {
    type: Number,
    min: 0,
    max: 600
  },
  abnormalities: [{
    type: String,
    enum: [
      'st_elevation', 'st_depression', 't_wave_inversion',
      'q_wave', 'r_wave_progression', 'left_bundle_branch_block',
      'right_bundle_branch_block', 'left_ventricular_hypertrophy',
      'right_ventricular_hypertrophy', 'atrial_enlargement'
    ]
  }],
  confidence: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  aiModel: {
    type: String,
    default: 'ecg_genius_v1'
  },
  modelVersion: {
    type: String,
    default: 'v1.0.0'
  },
  processingTime: {
    type: Number,
    default: 0
  }
});

export default analysisResultSchema;