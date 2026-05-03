import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, age, condition, dischargeDate, doctor, hospital } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword,
      name,
      age: age || 60,
      condition: condition || 'General Recovery',
      dischargeDate: dischargeDate || new Date(),
      doctor: doctor || 'Assigned Doctor',
      hospital: hospital || 'Care Center'
    });

    await user.save();
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '7d' });
    res.json({ user, token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
