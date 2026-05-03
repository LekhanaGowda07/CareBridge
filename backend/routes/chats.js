import express from 'express';
import { GoogleGenAI } from '@google/genai';
import Chat from '../models/Chat.js';

const router = express.Router();
let ai = null;

const getAI = () => {
  if (!ai && process.env.GEMINI_API_KEY) {
    // Trim to remove any accidental spaces in .env
    const key = process.env.GEMINI_API_KEY.trim();
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
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
    // 1. Save User Message
    const userMsg = new Chat(req.body);
    const savedUserMsg = await userMsg.save();

    const aiInstance = getAI();

    // 2. Fallback if no API Key
    if (!aiInstance) {
      const fallbackMsg = new Chat({
        sender: 'bot',
        message: "I am currently offline. Please add a GEMINI_API_KEY to your backend .env file to enable my AI capabilities!",
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        user: savedUserMsg.user
      });
      const savedFallback = await fallbackMsg.save();
      return res.status(201).json({ userMessage: savedUserMsg, botMessage: savedFallback });
    }

    // 3. Get recent history for context
    const history = await Chat.find({ user: savedUserMsg.user }).sort({ createdAt: 1 }).limit(8);
    let contextStr = "Past Conversation:\n";
    history.forEach(msg => {
      contextStr += `${msg.sender === 'bot' ? 'CareBridge' : 'User'}: ${msg.message}\n`;
    });

    const systemInstruction = `You are CareBridge, an empathetic, supportive post-hospitalization medical AI assistant. 
    Your job is to answer questions, check on symptoms, and provide general recovery guidance. 
    Do NOT provide official medical diagnoses. For severe symptoms, always recommend seeing a doctor. 
    Keep responses concise, warm, and conversational.`;

    const fullPrompt = `${systemInstruction}\n\n${contextStr}\nUser: ${req.body.message}`;

    // 4. Generate AI Response
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    // 5. Save AI Response
    const botMsg = new Chat({
      sender: 'bot',
      message: response.text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      user: savedUserMsg.user
    });
    
    const savedBotMsg = await botMsg.save();

    // 6. Return both
    res.status(201).json({ userMessage: savedUserMsg, botMessage: savedBotMsg });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
