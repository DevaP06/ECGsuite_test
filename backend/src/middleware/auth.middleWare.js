// src/Middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResponse } from '../utils/responseHandler.js';

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    try {
      if (!process.env.JWT_SECRET) {
        return sendResponse(res, 500, false, 'Authentication not configured: JWT_SECRET missing');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return sendResponse(res, 401, false, 'User no longer exists');
      }
      return next();
    } catch (err) {
      return sendResponse(res, 401, false, 'Not authorized, token failed');
    }
  } else {
    return sendResponse(res, 401, false, 'No token, authorization denied');
  }
};

export default protect;
