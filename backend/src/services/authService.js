import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toUserResponse(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    onboardingStep: user.onboardingStep,
    profile: user.profile
  };
}

// Accounts created before onboarding tracking existed have no onboardingStep
// in the DB (Mongoose defaults don't backfill existing documents). Treat them
// as already onboarded — they were already using the system under the old flow.
export function backfillLegacyOnboarding(user) {
  if (user.onboardingStep == null) {
    user.onboardingStep = 'complete';
  }
}

export async function registerUserService(body) {
  const { email, username, password } = body;

  if (!email || !username || !password) {
    throw createError('All fields are required', 400);
  }

  console.log('Mongo readyState:', mongoose.connection.readyState);
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw createError('Email or username already exists', 409);
  }

  const newUser = new User({ email, username, password });
  await newUser.save();

  return {
    token: generateToken(newUser._id, newUser.role),
    user: toUserResponse(newUser)
  };
}

export async function loginUserService(body) {
  const { emailOrUsername, password } = body;

  if (!emailOrUsername || !password) {
    throw createError('Email/Username and password are required', 400);
  }

  const user = await User.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
  }).select('+password');

  if (!user) {
    throw createError('User not found', 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError('Incorrect password', 401);
  }

  backfillLegacyOnboarding(user);
  user.lastLogin = new Date();
  await user.save({ validateModifiedOnly: true });

  return {
    token: generateToken(user._id, user.role),
    user: toUserResponse(user)
  };
}

export async function logoutUserService() {
  return {
    message: 'Logout successful'
  };
}