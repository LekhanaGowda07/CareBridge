import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import Chat from '../models/Chat.js';
import Medication from '../models/Medication.js';
import Symptom from '../models/Symptom.js';
import User from '../models/User.js';

const router = express.Router();
let ai = null;

const getAIModel = () => {
  if (process.env.GEMINI_API_KEY) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
    return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
  return null;
};

const getUserContext = async (userId) => {
  if (!userId || userId === 'static_user' || userId === 'demo') return "No specific user context available.";
  
  try {
    const [user, medications, symptoms] = await Promise.all([
      User.findById(userId),
      Medication.find({ user: userId }),
      Symptom.find({ user: userId }).sort({ date: -1 }).limit(5)
    ]);

    let context = `User Name: ${user?.name || 'Patient'}\n`;
    context += `Condition: ${user?.condition || 'Post-hospitalization recovery'}\n`;
    
    if (medications.length > 0) {
      context += `Medications: ${medications.map(m => `${m.name} (${m.dosage}, ${m.frequency}) - ${m.taken ? 'Taken' : 'Pending'}`).join(', ')}\n`;
    }
    
    if (symptoms.length > 0) {
      context += `Recent Symptoms: ${symptoms.map(s => `${s.type} (${s.severity}) on ${new Date(s.date).toLocaleDateString()}: ${s.notes}`).join('; ')}\n`;
    }

    return context;
  } catch (error) {
    console.error("Error fetching user context:", error);
    return "Error fetching user context.";
  }
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

// Delete all chat history for a user
router.delete('/user/:userId', async (req, res) => {
  try {
    await Chat.deleteMany({ user: req.params.userId });
    res.json({ message: 'Chat history cleared' });
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

    // 2. If botMessage is already provided (from streaming), just save and return
    if (req.body.botMessage) {
      const botMessageData = {
        sender: 'bot',
        message: req.body.botMessage,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        user: savedUserMsg.user || 'demo'
      };
      
      let savedBotMsg = botMessageData;
      if (isDBConnected) {
        const botMsg = new Chat(botMessageData);
        savedBotMsg = await botMsg.save();
      }
      return res.status(201).json({ userMessage: savedUserMsg, botMessage: savedBotMsg });
    }

    // 3. Fallback if no API Key
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

    // 4. Generate AI Response
    const userContext = await getUserContext(req.body.user);
    const systemInstruction = `You are CareBridge, an empathetic, supportive post-hospitalization medical AI assistant. 
    Your patient's current context is:\n${userContext}\n
    Keep responses concise, warm, and conversational. Use the context to provide relevant advice (e.g., reminding them of their meds or commenting on their symptoms). Do NOT provide official medical diagnoses.`;
    
    const prompt = `User: ${req.body.message}`;
    console.log('Sending prompt to Gemini...');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini Response Received:', text.substring(0, 50) + '...');

    // 5. Prepare AI Message
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

    // 6. Return both
    res.status(201).json({ userMessage: savedUserMsg, botMessage: savedBotMsg });
  } catch (error) {
    console.error("AI Error Details:", error);
    
    res.status(500).json({ 
      userMessage: req.body, 
      botMessage: {
        sender: 'bot',
        message: "I'm having trouble connecting to my AI brain. Please check your GEMINI_API_KEY. Error: " + error.message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }
    });
  }
});

// Stream AI response in real-time (Server-Sent Events style)
router.post('/stream', async (req, res) => {
  try {
    const model = getAIModel();

    // If no model, immediately respond with demo message
    if (!model) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders && res.flushHeaders();
      const msg = "I am currently in demo mode. Add a valid GEMINI_API_KEY to enable streaming AI responses.";
      res.write(`data: ${JSON.stringify({ delta: msg })}\n\n`);
      res.write('event: done\ndata: [DONE]\n\n');
      return res.end();
    }

    // Prepare prompt
    const userContext = await getUserContext(req.body.user);
    const systemInstruction = `You are CareBridge, an empathetic, supportive post-hospitalization medical AI assistant. 
    Your patient's current context is:\n${userContext}\n
    Keep responses concise, warm, and conversational. Use the context to provide relevant advice. Do NOT provide official medical diagnoses.`;
    const prompt = `User: ${req.body.message}`;

    // Start streaming response back to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (response && response.body && response.body.getReader) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          // Send chunk as SSE data event
          res.write(`data: ${JSON.stringify({ delta: chunk })}\n\n`);
        }
        done = readerDone;
      }
      // Signal completion
      res.write('event: done\ndata: [DONE]\n\n');
      return res.end();
    }

    // Fallback: read full text then send
    const text = response ? await response.text() : "";
    res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
    res.write('event: done\ndata: [DONE]\n\n');
    return res.end();

  } catch (error) {
    console.error('Streaming AI error:', error);
    
    // Check if headers were already sent to avoid [ERR_HTTP_HEADERS_SENT]
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders && res.flushHeaders();
    }

    const isLeaked = error.message.includes('leaked');
    const fallback = isLeaked 
      ? "My API key has been reported as leaked and disabled for security. Please update the GEMINI_API_KEY in the backend .env file."
      : "I'm having trouble streaming right now. Please try again shortly.";
      
    res.write(`data: ${JSON.stringify({ delta: fallback })}\n\n`);
    res.write('event: done\ndata: [DONE]\n\n');
    return res.end();
  }
});

export default router;
