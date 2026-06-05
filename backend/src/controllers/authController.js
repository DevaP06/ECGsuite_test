import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import {
  registerUserService,
  loginUserService,
  logoutUserService,
} from '../services/authService.js';
import { verifyGoogleUser } from '../services/googleAuthService.js';
import { logAction } from '../services/auditService.js';

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
