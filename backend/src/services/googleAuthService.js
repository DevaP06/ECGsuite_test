import User from '../models/User.js';
import { getGoogleClient } from '../config/googleClient.js';
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
    profilePicture: user.profilePicture,
    authProvider: user.authProvider
  };
}

function generateGoogleUsername(name) {
  const baseName = (name || 'googleuser').replace(/\s+/g, '').toLowerCase();
  const suffix = Math.random().toString(36).slice(2, 6);

  return `${baseName}${suffix}`;
}

async function generateUniqueGoogleUsername(name) {
  let username = generateGoogleUsername(name);

  while (await User.findOne({ username })) {
    username = generateGoogleUsername(name);
  }

  return username;
}

export async function verifyGoogleUser(credential) {
  if (!credential) {
    throw createError('Google credential is required', 400);
  }

  let payload;

  const client = getGoogleClient();
  if (!client) {
    throw createError('Google authentication not configured', 500);
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    payload = ticket.getPayload();
  } catch (error) {
    const message = error?.message || 'Google authentication failed';

    if (message.includes('Token used too early')) {
      throw createError('Invalid token timing', 400);
    }
    if (message.includes('Invalid token signature')) {
      throw createError('Invalid token signature', 400);
    }
    if (message.includes('Token used too late')) {
      throw createError('Token expired', 400);
    }

    throw createError('Google authentication failed', 500);
  }

  const { sub: googleId, email, name, picture } = payload || {};

  if (!googleId || !email) {
    throw createError('Invalid Google credential payload', 400);
  }

  let user = await User.findOne({
    $or: [{ googleId }, { email }]
  });

  let isNewUser = false;

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      user.profilePicture = picture;
      await user.save();
    }
  } else {
    isNewUser = true;
    const username = await generateUniqueGoogleUsername(name);

    user = new User({
      username,
      email,
      googleId,
      profilePicture: picture,
      authProvider: 'google'
    });

    await user.save();
  }

  user.lastLogin = new Date();
  await user.save({ validateModifiedOnly: true });

  return {
    isNewUser,
    token: generateToken(user._id, user.role),
    user: toUserResponse(user)
  };
}