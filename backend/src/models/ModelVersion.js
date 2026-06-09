import mongoose from 'mongoose';

const modelVersionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  version: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  framework: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100,
    default: null,
  },
  active: {
    type: Boolean,
    default: false,
  },
  deployedAt: {
    type: Date,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, { timestamps: true, versionKey: false });

modelVersionSchema.index({ active: 1 });
modelVersionSchema.index({ name: 1, version: 1 }, { unique: true });
modelVersionSchema.index({ createdAt: -1 });

export default mongoose.model('ModelVersion', modelVersionSchema);
