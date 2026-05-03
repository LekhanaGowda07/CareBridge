import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import userRoutes from './routes/users.js';
import medicationRoutes from './routes/medications.js';
import symptomRoutes from './routes/symptoms.js';
import chatRoutes from './routes/chats.js';
import authRoutes from './routes/auth.js';
import { auth } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/medications', auth, medicationRoutes);
app.use('/api/symptoms', auth, symptomRoutes);
app.use('/api/chat', auth, chatRoutes);

// Basic Route
app.get('/', (req, res) => {
  res.send('CareBridge API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
