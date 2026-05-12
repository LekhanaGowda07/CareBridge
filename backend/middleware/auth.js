import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token || token === 'mock_token' || token === 'undefined' || token === 'null') {
      // Bypassing auth for easier access as requested
      req.user = { id: 'mock_user_id' };
      return next();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
