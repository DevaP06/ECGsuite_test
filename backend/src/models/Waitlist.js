// src/models/Waitlist.js
import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    match: /.+\@.+\..+/
  },
  name: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'invited', 'rejected'], 
    default: 'pending' 
  },
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
}, { timestamps: true });

export default mongoose.model('Waitlist', waitlistSchema);
