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

// Get user's waitlist status (for logged-in users)
export const getUserWaitlistStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const waitlistEntry = await Waitlist.findOne({ userId });
    
    if (!waitlistEntry) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not on waitlist',
        onWaitlist: false
      });
    }

    // Get user's position in waitlist (how many are ahead of them)
    const position = await Waitlist.countDocuments({
      createdAt: { $lt: waitlistEntry.createdAt },
      status: { $ne: 'rejected' }
    });

    res.status(200).json({ 
      success: true,
      onWaitlist: true,
      data: {
        name: waitlistEntry.name,
        email: waitlistEntry.email,
        status: waitlistEntry.status,
        position: position + 1, // +1 because counting starts at 0
        joinedAt: waitlistEntry.joinedAt,
        invitedAt: waitlistEntry.invitedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user waitlist status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching waitlist status' 
    });
  }
};

// Link waitlist entry to user (when user signs up)
export const linkWaitlistToUser = async (req, res) => {
  try {
    const { userId, email } = req.body;

    const waitlistEntry = await Waitlist.findOneAndUpdate(
      { email: email.toLowerCase() },
      { userId },
      { new: true }
    );

    if (!waitlistEntry) {
      return res.status(404).json({
        success: false,
        message: 'Waitlist entry not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Waitlist linked to user account',
      data: waitlistEntry
    });
  } catch (error) {
    console.error('Error linking waitlist:', error);
    res.status(500).json({
      success: false,
      message: 'Error linking waitlist'
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
