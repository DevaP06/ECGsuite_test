import User from '../models/User.js';

export const registerUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Check if all fields are provided
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check for existing user by email or username
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    // Create and save new user
    const newUser = new User({
      email,
      username,
      password, // No hashing, as per your request
    });

    await newUser.save();

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
