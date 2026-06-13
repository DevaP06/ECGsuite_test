import mongoose from 'mongoose';

const ontologyEngineRuleSchema = new mongoose.Schema({
  ruleId:           { type: String, required: true, trim: true },
  ruleType:         { type: String, enum: ['mutual_exclusion', 'precedence', 'derived', 'downgrade'], required: true },
  primaryLabel:     { type: String, required: true, trim: true },
  relatedLabels:    { type: [String], default: [] },
  requiredSymptoms: { type: [String], default: [] },
  action:           { type: String, required: true, trim: true },
  delta:            { type: Number, default: 0 },
  version:          { type: String, trim: true, default: 'v2' },
  active:           { type: Boolean, default: true }
}, { timestamps: true });

ontologyEngineRuleSchema.index({ ruleId: 1 }, { unique: true });
ontologyEngineRuleSchema.index({ active: 1 });

export default mongoose.model('OntologyEngineRule', ontologyEngineRuleSchema);
