import mongoose from 'mongoose';

const symptomSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, required: true },
  severity: { type: String, required: true },
  notes: { type: String },
  actionNeeded: { type: Boolean, default: false },
  aiResponse: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Symptom', symptomSchema);
