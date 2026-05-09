import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = express.Router();

// Get all users (for testing/mocking auth)
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
       return res.json([]); // Return empty if DB is not ready
    }
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.json([]); // Fallback to empty instead of 500
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
