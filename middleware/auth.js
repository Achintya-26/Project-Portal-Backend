const jwt = require('jsonwebtoken');
const queries = require('../models/queries');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  // console.log('Auth middleware called for:', req.path);
  // console.log('Authorization header:', req.headers.authorization);
  
  const auth = req.headers.authorization?.split(' ');
  if (auth?.[0] !== 'Bearer' || !auth[1]) {
    console.log('No valid authorization header found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(auth[1], JWT_SECRET);
    // console.log('Token decoded:', decoded);
    const user = await queries.getUserById(decoded.id);
    if (!user) {
      console.log('User not found for id:', decoded.id);
      throw new Error();
    }
    console.log('User found:', user.username);
    req.user = user;
    next();
  } catch (error) {
    console.log('Token verification failed:', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};
