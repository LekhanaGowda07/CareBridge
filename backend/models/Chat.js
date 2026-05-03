import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  sender: { type: String, enum: ['bot', 'user'], required: true },
  message: { type: String, required: true },
  timestamp: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Chat', chatSchema);
