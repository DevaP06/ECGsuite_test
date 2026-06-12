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
  qtcInterval: {
    type: Number,
    min: 0,
    max: 700
  },
  rrInterval: {
    type: Number,
    min: 0,
    max: 3000
  },
  abnormalities: [{ type: String }],
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
  },
  predictedLabels: [{
    type: String
  }],
  labelProbabilities: {
    type: Map,
    of: Number
  },
  topPredictions: [{
    rhythm: String,
    fullName: String,
    snomedCt: String,
    confidence: {
      type: Number,
      min: 0,
      max: 100
    }
  }],
  signalMetrics: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyLevel: {
    type: String,
    enum: ['none', 'low', 'moderate', 'high', 'critical'],
    default: 'none'
  },
  ontologyEnrichment: [{
    displayName: String,
    confidenceTier: String,
    urgencyTier: String,
    isEmergency: { type: Boolean, default: false },
    severity: String,
    recommendedTests: [{ type: String }]
  }],
  explanation: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

export default analysisResultSchema;