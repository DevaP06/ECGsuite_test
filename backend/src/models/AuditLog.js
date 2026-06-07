import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  entityType: {
    type: String,
    enum: ['USER', 'ECG_ANALYSIS', 'SPECIALIST_REVIEW', 'PATIENT', 'PATIENT_HISTORY'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  action: {
    type: String,
    enum: ['LOGIN', 'REGISTER', 'LOGOUT', 'UPLOAD', 'DELETE', 'UPDATE', 'VIEW', 'REVIEW'],
    required: true
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { versionKey: false });

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1 });

export default mongoose.model('AuditLog', auditLogSchema);
