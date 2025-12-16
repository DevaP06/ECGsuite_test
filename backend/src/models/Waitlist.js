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
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
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
  invitedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.model('Waitlist', waitlistSchema);
