import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
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
  },
  contact: {
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true }
  },
  medicalProfile: {
    knownConditions: { type: String, trim: true },
    currentMedications: { type: String, trim: true },
    medicalHistory: { type: String, trim: true },
    notes: { type: String, trim: true }
  },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

patientSchema.index({ name: 1 });
patientSchema.index({ registeredBy: 1, createdAt: -1 });
patientSchema.index({ 'contact.phone': 1 });

export default mongoose.model('Patient', patientSchema);
