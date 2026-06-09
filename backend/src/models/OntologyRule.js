import mongoose from 'mongoose';

const ontologyRuleSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true },
  display: { type: String, required: true, trim: true },
  system: {
    type: String,
    enum: ['snomed', 'icd10', 'custom'],
    required: true
  },
  urgencyTier: {
    type: String,
    enum: ['critical', 'high', 'moderate', 'low'],
    required: true
  },
  confidenceThreshold: { type: Number, required: true, min: 0, max: 100, default: 70 },
  isEmergency: { type: Boolean, default: false },
  triageCategory: { type: String, trim: true },
  triggerConditions: { type: [String], default: [] },
  relatedCodes: { type: [String], default: [] },
  version: { type: String, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

ontologyRuleSchema.index({ system: 1, urgencyTier: 1 });
ontologyRuleSchema.index({ code: 1 }, { unique: true });
ontologyRuleSchema.index({ active: 1 });

export default mongoose.model('OntologyRule', ontologyRuleSchema);
