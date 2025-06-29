const express = require('express');
const jwt = require('jsonwebtoken');
const queries = require('../models/queries');
const bcrypt = require('bcrypt');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Registration
router.post('/register', async (req, res) => {
  try {
    const user = await queries.createUser(req.body);
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Username or email already exists.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await queries.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
