// src/controllers/authController.js
import User from '../models/User.js';

export const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ error: 'Email or username already exists' });
    }

    const newUser = new User({ email, username, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Use the password comparison method from the User model
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // For stateless authentication, logout is handled client-side
    // Just send a success response
    res.status(200).json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Check if Google Client ID is configured
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('GOOGLE_CLIENT_ID not found in environment variables');
      return res.status(500).json({ error: 'Google authentication not configured' });
    }

    console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID);
    console.log('Received credential length:', credential.length);

    // Verify the Google token
    const { OAuth2Client } = await import('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({
      $or: [{ googleId }, { email }]
    });

    let isNewUser = false;
    console.log('Google Auth Debug:', {
      email,
      googleId,
      userFound: !!user,
      existingAuthProvider: user?.authProvider,
      existingGoogleId: user?.googleId
    });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        user.profilePicture = picture;
        await user.save();
        console.log('Updated existing user with Google info');
      } else {
        console.log('User already has Google auth setup');
      }
    } else {
      // Create new user
      isNewUser = true;
      console.log('Creating new user with Google auth');
      user = new User({
        username: name.replace(/\s+/g, '').toLowerCase() + Math.random().toString(36).substr(2, 4),
        email,
        googleId,
        profilePicture: picture,
        authProvider: 'google'
      });
      await user.save();
    }

    res.status(200).json({
      message: isNewUser ? 'Account created successfully with Google' : 'Welcome back! Signed in with Google',
      isNewUser,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        authProvider: user.authProvider
      }
    });
  } catch (err) {
    console.error('Google Auth Error:', err);
    console.error('Error details:', err.message);
    console.error('Error stack:', err.stack);

    // More specific error messages
    if (err.message.includes('Token used too early')) {
      return res.status(400).json({ error: 'Invalid token timing' });
    }
    if (err.message.includes('Invalid token signature')) {
      return res.status(400).json({ error: 'Invalid token signature' });
    }
    if (err.message.includes('Token used too late')) {
      return res.status(400).json({ error: 'Token expired' });
    }

    res.status(500).json({
      error: 'Google authentication failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};
