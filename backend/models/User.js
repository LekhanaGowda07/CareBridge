import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  condition: { type: String, required: true },
  dischargeDate: { type: Date, required: true },
  doctor: { type: String, required: true },
  hospital: { type: String, required: true },
  avatar: { type: String }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
