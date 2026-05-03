import express from 'express';
import Symptom from '../models/Symptom.js';

const router = express.Router();

// Get all symptoms for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const symptoms = await Symptom.find({ user: req.params.userId }).sort({ date: -1 });
    res.json(symptoms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Log a new symptom
router.post('/', async (req, res) => {
  try {
    const symptom = new Symptom(req.body);
    const savedSymptom = await symptom.save();
    res.status(201).json(savedSymptom);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
