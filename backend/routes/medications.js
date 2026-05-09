import express from 'express';
import mongoose from 'mongoose';
import Medication from '../models/Medication.js';

const router = express.Router();

// Get all medications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
       return res.json([]); // Return empty if DB is not ready
    }
    const medications = await Medication.find({ user: req.params.userId }).sort({ time: 1 });
    res.json(medications);
  } catch (error) {
    console.error('Fetch medications error:', error);
    res.json([]); // Fallback to empty instead of 500
  }
});

// Update medication status (e.g. mark as taken)
router.put('/:id', async (req, res) => {
  try {
    const medication = await Medication.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medication) return res.status(404).json({ message: 'Medication not found' });
    res.json(medication);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
