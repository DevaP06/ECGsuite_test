// src/controllers/waitlistController.js
import Waitlist from '../models/Waitlist.js';
import { sendResponse } from '../utils/responseHandler.js';

// Add user to waitlist
export const addToWaitlist = async (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate input
    if (!email || !name) {
      return sendResponse(res, 400, false, 'Email and name are required');
    }

    // Check if already on waitlist
    const existingEntry = await Waitlist.findOne({ email });
    if (existingEntry) {
      return sendResponse(res, 400, false, 'You are already on the waitlist!');
    }

    // Create new waitlist entry
    const waitlistEntry = new Waitlist({ email, name });
    await waitlistEntry.save();

    return sendResponse(res, 201, true, 'Successfully added to waitlist!', waitlistEntry);
  } catch (error) {
    console.error('Waitlist error:', error);
    if (error.code === 11000) {
      return sendResponse(res, 400, false, 'This email is already on our waitlist!');
    }
    return sendResponse(res, 500, false, 'Error adding to waitlist');
  }
};

// Get user's waitlist status (for logged-in users)
export const getUserWaitlistStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const waitlistEntry = await Waitlist.findOne({ userId });
    
    if (!waitlistEntry) {
      return sendResponse(res, 404, false, 'User not on waitlist', { onWaitlist: false });
    }

    // Get user's position in waitlist (how many are ahead of them)
    const position = await Waitlist.countDocuments({
      createdAt: { $lt: waitlistEntry.createdAt },
      status: { $ne: 'rejected' }
    });

    return sendResponse(res, 200, true, 'Waitlist status fetched successfully', {
      onWaitlist: true,
      waitlist: {
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
    return sendResponse(res, 500, false, 'Error fetching waitlist status');
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
      return sendResponse(res, 404, false, 'Waitlist entry not found');
    }

    return sendResponse(res, 200, true, 'Waitlist linked to user account', waitlistEntry);
  } catch (error) {
    console.error('Error linking waitlist:', error);
    return sendResponse(res, 500, false, 'Error linking waitlist');
  }
};

// Get all waitlist entries (admin)
export const getWaitlist = async (req, res) => {
  try {
    const waitlist = await Waitlist.find().sort({ createdAt: -1 });
    return sendResponse(res, 200, true, 'Waitlist fetched successfully', {
      count: waitlist.length,
      waitlist
    });
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return sendResponse(res, 500, false, 'Error fetching waitlist');
  }
};

// Check if email is on waitlist
export const checkWaitlistStatus = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return sendResponse(res, 400, false, 'Email is required');
    }

    const entry = await Waitlist.findOne({ email });
    return sendResponse(res, 200, true, 'Waitlist status checked successfully', {
      onWaitlist: !!entry,
      status: entry?.status || null
    });
  } catch (error) {
    console.error('Error checking waitlist:', error);
    return sendResponse(res, 500, false, 'Error checking waitlist status');
  }
};
