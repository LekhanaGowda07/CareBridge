export const userData = {
  name: "Sarah Jenkins",
  age: 68,
  condition: "Post-Cardiac Surgery",
  dischargeDate: "2026-04-28",
  doctor: "Dr. Robert Chen",
  hospital: "HeartCare Center",
  avatar: "https://i.pravatar.cc/150?u=sarah"
};

export const medications = [
  {
    id: 1,
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily in the morning",
    time: "08:00 AM",
    taken: true,
    type: "Blood Pressure"
  },
  {
    id: 2,
    name: "Aspirin",
    dosage: "81mg",
    frequency: "Once daily with food",
    time: "12:00 PM",
    taken: false,
    type: "Blood Thinner"
  },
  {
    id: 3,
    name: "Atorvastatin",
    dosage: "40mg",
    frequency: "Once daily at bedtime",
    time: "09:00 PM",
    taken: false,
    type: "Cholesterol"
  }
];

export const recentSymptoms = [
  {
    id: 1,
    date: "2026-05-01T08:30:00",
    type: "Pain Level",
    severity: "Mild (3/10)",
    notes: "Slight discomfort around incision site.",
    actionNeeded: false
  },
  {
    id: 2,
    date: "2026-04-30T14:15:00",
    type: "Fatigue",
    severity: "Moderate",
    notes: "Felt very tired after short walk.",
    actionNeeded: false
  },
  {
    id: 3,
    date: "2026-04-29T09:00:00",
    type: "Shortness of Breath",
    severity: "Severe",
    notes: "Trouble breathing while resting.",
    actionNeeded: true,
    aiResponse: "Please contact Dr. Chen immediately or visit the ER."
  }
];

export const aiChatHistory = [
  {
    id: 1,
    sender: "bot",
    message: "Good morning, Sarah. How are you feeling today? Did you sleep well?",
    timestamp: "08:00 AM"
  },
  {
    id: 2,
    sender: "user",
    message: "I feel okay. A bit sore around my chest, but I slept better than yesterday.",
    timestamp: "08:05 AM"
  },
  {
    id: 3,
    sender: "bot",
    message: "I'm glad you slept better. Mild soreness is normal. Have you taken your 8:00 AM Lisinopril?",
    timestamp: "08:05 AM"
  }
];
