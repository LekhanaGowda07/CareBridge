import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Medication from './models/Medication.js';
import Symptom from './models/Symptom.js';
import Chat from './models/Chat.js';

dotenv.config();

const userData = {
  email: "sarah@example.com",
  password: "password123",
  name: "Sarah Jenkins",
  age: 68,
  condition: "Post-Cardiac Surgery",
  dischargeDate: new Date("2026-04-28"),
  doctor: "Dr. Robert Chen",
  hospital: "HeartCare Center",
  avatar: "https://i.pravatar.cc/150?u=sarah"
};

const medications = [
  {
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily in the morning",
    time: "08:00 AM",
    taken: true,
    type: "Blood Pressure"
  },
  {
    name: "Aspirin",
    dosage: "81mg",
    frequency: "Once daily with food",
    time: "12:00 PM",
    taken: false,
    type: "Blood Thinner"
  },
  {
    name: "Atorvastatin",
    dosage: "40mg",
    frequency: "Once daily at bedtime",
    time: "09:00 PM",
    taken: false,
    type: "Cholesterol"
  }
];

const recentSymptoms = [
  {
    date: new Date("2026-05-01T08:30:00"),
    type: "Pain Level",
    severity: "Mild (3/10)",
    notes: "Slight discomfort around incision site.",
    actionNeeded: false
  },
  {
    date: new Date("2026-04-30T14:15:00"),
    type: "Fatigue",
    severity: "Moderate",
    notes: "Felt very tired after short walk.",
    actionNeeded: false
  },
  {
    date: new Date("2026-04-29T09:00:00"),
    type: "Shortness of Breath",
    severity: "Severe",
    notes: "Trouble breathing while resting.",
    actionNeeded: true,
    aiResponse: "Please contact Dr. Chen immediately or visit the ER."
  }
];

const aiChatHistory = [
  {
    sender: "bot",
    message: "Good morning, Sarah. How are you feeling today? Did you sleep well?",
    timestamp: "08:00 AM"
  },
  {
    sender: "user",
    message: "I feel okay. A bit sore around my chest, but I slept better than yesterday.",
    timestamp: "08:05 AM"
  },
  {
    sender: "bot",
    message: "I'm glad you slept better. Mild soreness is normal. Have you taken your 8:00 AM Lisinopril?",
    timestamp: "08:05 AM"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for Seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Medication.deleteMany({});
    await Symptom.deleteMany({});
    await Chat.deleteMany({});

    console.log('Existing data cleared.');

    // Create User
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new User({ ...userData, password: hashedPassword });
    const savedUser = await user.save();
    console.log('User created:', savedUser.name);

    // Create Medications
    for (let med of medications) {
      const newMed = new Medication({ ...med, user: savedUser._id });
      await newMed.save();
    }
    console.log('Medications added.');

    // Create Symptoms
    for (let symptom of recentSymptoms) {
      const newSymptom = new Symptom({ ...symptom, user: savedUser._id });
      await newSymptom.save();
    }
    console.log('Symptoms added.');

    // Create Chats
    for (let chat of aiChatHistory) {
      const newChat = new Chat({ ...chat, user: savedUser._id });
      await newChat.save();
    }
    console.log('Chats added.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
