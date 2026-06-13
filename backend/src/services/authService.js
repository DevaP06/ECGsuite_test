import mongoose from 'mongoose';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { generateToken, generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from '../utils/generateToken.js';

function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Creates a new refresh-token record for a user and returns the raw
// (unhashed) token — only the hash is persisted.
export async function issueRefreshToken(userId) {
  const rawToken = generateRefreshToken();
  await RefreshToken.create({
    userId,
    tokenHash: hashRefreshToken(rawToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  });
  return rawToken;
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
    refreshToken: await issueRefreshToken(newUser._id),
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
    refreshToken: await issueRefreshToken(user._id),
    user: toUserResponse(user)
  };
}

// Validates a presented refresh token, rotates it (issuing a new access +
// refresh token pair), and revokes the old one. If a token that was already
// rotated/revoked is presented again, every active token for that user is
// revoked — reuse of a retired token is treated as a sign of theft.
export async function refreshSessionService(rawToken) {
  if (!rawToken) {
    throw createError('Refresh token missing', 401);
  }

  const tokenHash = hashRefreshToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash });

  if (!stored) {
    throw createError('Invalid refresh token', 401);
  }

  if (stored.revokedAt) {
    await RefreshToken.updateMany(
      { userId: stored.userId, revokedAt: null },
      { revokedAt: new Date() }
    );
    throw createError('Refresh token has already been used. Please log in again.', 401);
  }

  if (stored.expiresAt < new Date()) {
    throw createError('Refresh token expired. Please log in again.', 401);
  }

  const user = await User.findById(stored.userId);
  if (!user) {
    throw createError('User no longer exists', 401);
  }
  if (user.status === 'suspended') {
    throw createError('Your account has been suspended', 403);
  }

  const newRawToken = generateRefreshToken();
  stored.revokedAt = new Date();
  stored.replacedByTokenHash = hashRefreshToken(newRawToken);
  await stored.save();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: stored.replacedByTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  });

  return {
    token: generateToken(user._id, user.role),
    refreshToken: newRawToken,
    user: toUserResponse(user)
  };
}

export async function logoutUserService(rawToken) {
  if (rawToken) {
    await RefreshToken.updateOne(
      { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
      { revokedAt: new Date() }
    );
  }
  return {
    message: 'Logout successful'
  };
}