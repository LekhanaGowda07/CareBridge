import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';

const router = express.Router();
let ai = null;

const getAIModel = () => {
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return null;
};

// Get chat history for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const chats = await Chat.find({ user: req.params.userId }).sort({ createdAt: 1 });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a new message and get AI response
router.post('/', async (req, res) => {
  try {
    const isDBConnected = mongoose.connection.readyState === 1;
    console.log('Incoming Chat Request:', req.body.message);
    
    // 1. Prepare User Message (don't save yet if DB is down)
    const userMessageData = {
      ...req.body,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    let savedUserMsg = userMessageData;
    if (isDBConnected) {
      const userMsg = new Chat(userMessageData);
      savedUserMsg = await userMsg.save();
    }

    const model = getAIModel();

    // 2. Fallback if no API Key
    if (!model) {
      console.log('No AI Model found, sending demo fallback');
      const botMsg = {
        sender: 'bot',
        message: "I am currently in demo mode. Please add a valid GEMINI_API_KEY to enable my AI capabilities!",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        user: savedUserMsg.user || 'demo'
      };
      return res.status(201).json({ userMessage: savedUserMsg, botMessage: botMsg });
    }

    // 3. Generate AI Response
    const systemInstruction = `You are CareBridge, an empathetic, supportive post-hospitalization medical AI assistant. 
    Keep responses concise, warm, and conversational. Do NOT provide official medical diagnoses.`;
    
    const prompt = `${systemInstruction}\n\nUser: ${req.body.message}`;
    console.log('Sending prompt to Gemini...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini Response Received:', text.substring(0, 50) + '...');

    // 4. Prepare AI Message
    const botMessageData = {
      sender: 'bot',
      message: text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      user: savedUserMsg.user || 'demo'
    };
    
    let savedBotMsg = botMessageData;
    if (isDBConnected) {
      const botMsg = new Chat(botMessageData);
      savedBotMsg = await botMsg.save();
    }

    // 5. Return both
    res.status(201).json({ userMessage: savedUserMsg, botMessage: savedBotMsg });
  } catch (error) {
    console.error("AI Error Details:", error);
    
    // Smart Mock Fallback for Demo Purposes
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('not valid')) {
      const userMsg = req.body.message.toLowerCase();
      let mockReply = "That's a good question. For your specific recovery, it's best to follow the discharge papers Dr. Chen gave you. Generally, focus on staying hydrated and resting. Is there anything specific you're feeling right now?";
      
      if (userMsg.includes('pain') || userMsg.includes('hurt') || userMsg.includes('sore')) {
        mockReply = "It's common to feel some soreness or mild pain in the first week. However, if the pain is sharp, sudden, or increasing, you should call your care team immediately. Have you taken your scheduled pain medication?";
      } else if (userMsg.includes('med') || userMsg.includes('pill') || userMsg.includes('dose') || userMsg.includes('lisinopril')) {
        mockReply = "Maintaining your medication schedule is critical for heart health. Lisinopril helps manage your blood pressure. If you missed a dose, don't double up—just take the next one as scheduled.";
      } else if (userMsg.includes('walk') || userMsg.includes('exercise') || userMsg.includes('move') || userMsg.includes('active')) {
        mockReply = "Walking is the best exercise right now! Start with very short paths (like to the kitchen) and gradually increase. If you feel dizzy or short of breath, sit down immediately.";
      } else if (userMsg.includes('shower') || userMsg.includes('bath') || userMsg.includes('wash')) {
        mockReply = "Usually, you can shower 48 hours after surgery, but you must keep the incision site dry and avoid scrubbing it. Don't submerge in a bath or pool until Dr. Chen gives the okay.";
      } else if (userMsg.includes('eat') || userMsg.includes('food') || userMsg.includes('diet') || userMsg.includes('salt')) {
        mockReply = "A heart-healthy diet is key. Focus on low-sodium foods, fresh vegetables, and lean proteins. Avoid processed foods as they are high in salt, which can raise your blood pressure.";
      } else if (userMsg.includes('sleep') || userMsg.includes('tired') || userMsg.includes('night')) {
        mockReply = "Your body does most of its healing while you sleep. If you're having trouble sleeping due to discomfort, try using extra pillows for support. Fatigue is very normal during the first few weeks.";
      } else if (userMsg.includes('doctor') || userMsg.includes('appointment') || userMsg.includes('chen')) {
        mockReply = "Your follow-up appointment with Dr. Chen is a great time to ask detailed questions. I recommend writing down any symptoms you've noticed so you can discuss them then.";
      } else if (userMsg.includes('hello') || userMsg.includes('hi') || userMsg.includes('hey')) {
        mockReply = "Hello! I'm CareBridge, your AI recovery assistant. I'm here to help you navigate your post-hospitalization care. What's on your mind?";
      }

      const botMessageData = {
        sender: 'bot',
        message: mockReply,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        user: req.body.user || 'demo'
      };

      return res.status(201).json({ userMessage: req.body, botMessage: botMessageData });
    }

    res.status(200).json({ 
      userMessage: req.body, 
      botMessage: {
        sender: 'bot',
        message: "I'm having a bit of trouble connecting to my brain right now. Error: " + error.message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }
    });
  }
});

export default router;
