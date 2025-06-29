const jwt = require('jsonwebtoken');
const queries = require('../models/queries');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  const auth = req.headers.authorization?.split(' ');
  if (auth?.[0] !== 'Bearer' || !auth[1]) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(auth[1], JWT_SECRET);
    const user = await queries.getUserById(decoded.id);
    if (!user) throw new Error();
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
