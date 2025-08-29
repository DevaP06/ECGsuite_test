import mongoose from 'mongoose';

const patientInfoSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: true
  }
});

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
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  }
});

const ecgAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    enum: ['image', 'csv', 'json', 'excel'],
    required: true
  },
  patientInfo: {
    type: patientInfoSchema,
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed', 'archived'],
    default: 'uploaded'
  },
  analysisResult: {
    type: analysisResultSchema,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  archivedAt: {
    type: Date,
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    device: String,
    samplingRate: Number,
    leadCount: Number,
    duration: Number, // in seconds
    voltageRange: {
      min: Number,
      max: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ecgAnalysisSchema.index({ userId: 1, createdAt: -1 });
ecgAnalysisSchema.index({ status: 1 });
ecgAnalysisSchema.index({ 'patientInfo.name': 1 });
ecgAnalysisSchema.index({ tags: 1 });

// Virtual for file size in MB
ecgAnalysisSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for age group
ecgAnalysisSchema.virtual('ageGroup').get(function() {
  if (!this.patientInfo?.age) return null;
  if (this.patientInfo.age < 18) return 'pediatric';
  if (this.patientInfo.age < 65) return 'adult';
  return 'elderly';
});

// Pre-save middleware to set file type
ecgAnalysisSchema.pre('save', function(next) {
  if (this.originalName) {
    const ext = this.originalName.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'tiff', 'bmp'].includes(ext)) {
      this.fileType = 'image';
    } else if (ext === 'csv') {
      this.fileType = 'csv';
    } else if (ext === 'json') {
      this.fileType = 'json';
    } else if (['xls', 'xlsx'].includes(ext)) {
      this.fileType = 'excel';
    }
  }
  next();
});

// Instance method to get analysis summary
ecgAnalysisSchema.methods.getAnalysisSummary = function() {
  if (!this.analysisResult) {
    return {
      status: 'No analysis available',
      message: 'ECG file has not been processed yet'
    };
  }

  return {
    rhythm: this.analysisResult.rhythm,
    heartRate: this.analysisResult.heartRate,
    abnormalities: this.analysisResult.abnormalities,
    confidence: this.analysisResult.confidence,
    isNormal: this.analysisResult.rhythm === 'normal' && 
              this.analysisResult.abnormalities.length === 0
  };
};

// Static method to get statistics
ecgAnalysisSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalAnalyses: { $sum: 1 },
        completedAnalyses: { 
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        totalFileSize: { $sum: '$fileSize' },
        averageConfidence: { $avg: '$analysisResult.confidence' }
      }
    }
  ]);

  return stats[0] || {
    totalAnalyses: 0,
    completedAnalyses: 0,
    totalFileSize: 0,
    averageConfidence: 0
  };
};

const ECGAnalysis = mongoose.model('ECGAnalysis', ecgAnalysisSchema);

export default ECGAnalysis;
