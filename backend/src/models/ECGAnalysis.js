import mongoose from 'mongoose';
import patientInfoSchema from './schema/PatientInfo.js';
import analysisResultSchema from './schema/AnalysisResult.js';

const ecgAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true,
    max: 20 * 1024 * 1024
  },
  fileType: {
    type: String,
    enum: ['image', 'csv', 'json', 'excel', 'mat']
  },
  storageUrl: {
    type: String,
    trim: true
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
    enum: ['uploaded', 'processing', 'pending', 'completed', 'failed', 'archived'],
    default: 'uploaded'
  },
  failureReason: {
   type: String,
   trim: true,
   validate: {
      validator: function(v){
         return this.status === 'failed' || !v;
      },
      message: 'Failure reason only allowed when status is failed'
   }
  },
  analysisResult: {
    type: analysisResultSchema,
    default: null
  },
  // Patient clinical context submitted via the clinical-context wizard
  // ({ symptoms, riskFactors, vitals } boolean maps). Stored for durability /
  // audit; used to re-fuse the ontology differential (clinicalContextController).
  clinicalContext: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  clinicalContextAt: {
    type: Date,
    default: null
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
  metadata:{
   device:String,

   samplingRate:{
      type:Number,
      min:1
   },

   leadCount:{
      type:Number,
      min:1,
      max:12
   },

   duration:{
      type:Number,
      min:0
   },

   voltageRange:{
      min:Number,
      max:Number
   }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ecgAnalysisSchema.index({ userId: 1, createdAt: -1 });
ecgAnalysisSchema.index({ patientId: 1, createdAt: -1 });
ecgAnalysisSchema.index({ status: 1 });
ecgAnalysisSchema.index({ 'patientInfo.name': 1 });
ecgAnalysisSchema.index({ tags: 1 });

// Virtual for file size in MB
ecgAnalysisSchema.virtual('fileSizeMB').get(function() {
  return Number(
   (this.fileSize/(1024*1024))
   .toFixed(2)
  );
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
  const ext = this.originalName
    ?.toLowerCase()
    ?.split('.')
    ?.pop();

  if (!ext) {
    return next();
  }

  this.fileType = this.fileType || null;
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
