import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI("AIzaSyDkekQCbUs34pyPKLH9eNrCEBEj06BoDm4AIzaSyDRaLyrv1vHYdTbmF8fNvEiJwye4398Ym4");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function run() {
  try {
    const result = await model.generateContent("Hello");
    console.log(await result.response.text());
  } catch (error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
  }
}

run();
