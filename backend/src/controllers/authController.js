import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import {
  registerUserService,
  loginUserService,
  logoutUserService,
} from '../services/authService.js';
import { verifyGoogleUser } from '../services/googleAuthService.js';
import { logAction } from '../services/auditService.js';
import User from '../models/User.js';

export const registerUser = asyncHandler(async (req, res) => {
  const result = await registerUserService(req.body);
  return sendResponse(res, 201, true, 'User registered successfully', {
    token: result.token,
    user: result.user
  });
});

export const loginUser = asyncHandler(async (req, res) => {
  const result = await loginUserService(req.body);
  logAction({ req, userId: result.user.id, entityType: 'USER', entityId: result.user.id, action: 'LOGIN' });
  return sendResponse(res, 200, true, 'Login successful', {
    token: result.token,
    user: result.user
  });
});

export const logoutUser = asyncHandler(async (req, res) => {
  const result = await logoutUserService();
  return sendResponse(res, 200, true, result.message, null);
});

export const getMe = asyncHandler(async (req, res) => {
  const { _id, username, email, role, fullName, phone, profilePicture, authProvider, isVerified, status, lastLogin, createdAt } = req.user;
  return sendResponse(res, 200, true, 'User fetched successfully', {
    user: { id: _id, username, email, role, fullName, phone, profilePicture, authProvider, isVerified, status, lastLogin, createdAt }
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phone, profilePicture } = req.body;
  const updates = {};
  if (fullName !== undefined) updates.fullName = String(fullName).trim();
  if (phone !== undefined) updates.phone = String(phone).trim();
  if (profilePicture !== undefined) updates.profilePicture = profilePicture;

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password -googleId');
  logAction({ req, userId: req.user._id, entityType: 'USER', entityId: req.user._id, action: 'UPDATE', newValue: updates });
  return sendResponse(res, 200, true, 'Profile updated successfully', { user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return sendResponse(res, 400, false, 'currentPassword and newPassword are required');
  }
  if (newPassword.length < 8) {
    return sendResponse(res, 400, false, 'New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user.password) {
    return sendResponse(res, 400, false, 'Password change is not available for Google-linked accounts');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return sendResponse(res, 401, false, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  logAction({ req, userId: user._id, entityType: 'USER', entityId: user._id, action: 'UPDATE' });
  return sendResponse(res, 200, true, 'Password changed successfully', null);
});

export const googleAuth = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  const result = await verifyGoogleUser(credential);

  return sendResponse(
    res,
    200,
    true,
    result.isNewUser
      ? 'Account created successfully with Google'
      : 'Welcome back! Signed in with Google',
    result
  );
});
