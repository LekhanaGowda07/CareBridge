import { GoogleGenerativeAI } from '@google/generative-ai';

async function testKey(key) {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log(`Key ${key.substring(0, 10)}... works! response:`, await result.response.text());
  } catch (e) {
    console.log(`Key ${key.substring(0, 10)}... failed:`, e.message);
  }
}

async function run() {
  await testKey("AIzaSyDRaLyrv1vHYdTbmF8fNvEiJwye4398Ym4");
}

run();
