import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels(apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log("Response:", data);
    }
  } catch (e) {
    console.error("Error listing models:", e.message);
  }
}

// Read API key from .env
import dotenv from 'dotenv';
dotenv.config();
const key = process.env.GEMINI_API_KEY.trim();
console.log("Using key starting with:", key.substring(0, 10));
listModels(key);
