// src/controllers/waitlistController.js
import Waitlist from '../models/Waitlist.js';

// Add user to waitlist
export const addToWaitlist = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate input
    if (!email || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and name are required' 
      });
    }

    // Check if already on waitlist
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already on the waitlist!' 
      });
    }

    // Create new waitlist entry
    const waitlistEntry = new Waitlist({ email, name });
    await waitlistEntry.save();

    res.status(201).json({ 
      success: true, 
      message: 'Successfully added to waitlist!',
      data: waitlistEntry
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'This email is already on our waitlist!' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Error adding to waitlist' 
    });
  }
};

// Get all waitlist entries (admin)
export const getWaitlist = async (req, res) => {
  try {
    const waitlist = await Waitlist.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: waitlist.length,
      data: waitlist 
    });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching waitlist' 
    });
  }
};

// Check if email is on waitlist
export const checkWaitlistStatus = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const entry = await Waitlist.findOne({ email });
    res.status(200).json({ 
      success: true, 
      onWaitlist: !!entry,
      status: entry?.status || null
    });
  } catch (error) {
    console.error('Error checking waitlist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking waitlist status' 
    });
  }
};
