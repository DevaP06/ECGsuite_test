import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment');
  }

  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};