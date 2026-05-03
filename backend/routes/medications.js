import express from 'express';
import Medication from '../models/Medication.js';

const router = express.Router();

// Get all medications for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const medications = await Medication.find({ user: req.params.userId }).sort({ time: 1 });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
