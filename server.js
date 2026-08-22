const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// RAM Memory Storage for Vercel Serverless
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Model Fallback Priority List
const MODEL_CANDIDATES = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro'
];

// Helper: Try models sequentially until one succeeds
async function generateWithFallback(prompt, imagePart) {
  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text().trim();
      return { responseText, usedModel: modelName };
    } catch (err) {
      console.warn(`Model ${modelName} failed (${err.message}). Trying next fallback...`);
      lastError = err;
    }
  }
  throw lastError || new Error('All model fallbacks exhausted.');
}

// Classification Handler
const handleAnalysis = async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in Vercel environment variables.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const prompt = `You are an expert waste classification AI for Indian municipal segregation standards.
Analyze the image and respond ONLY with a raw JSON object (no markdown, no backticks, no explanations):
{
  "item": "Name of the detected object",
  "category": "DRY" or "WET" or "HAZARDOUS" or "E-WASTE",
  "bin": "Blue Bin" or "Green Bin" or "Red Bin" or "Special Handling",
  "recyclable": true,
  "confidence": 95,
  "hinglish_message": "A helpful, conversational message in Hinglish explaining how to dispose it",
  "tips": "Practical step-by-step segregation or cleaning tip",
  "impact": {
    "co2_avoided_kg": 0.25,
    "water_conserved_l": 1.5,
    "landfill_diverted_m2": 0.05
  }
}`;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype || 'image/jpeg'
      }
    };

    const { responseText, usedModel } = await generateWithFallback(prompt, imagePart);

    // Clean any markdown backticks
    let cleanedText = responseText;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(cleanedText);
    parsedData.model_used = usedModel;

    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Final Classification Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process waste image classification.'
    });
  }
};

// Routes
app.post('/api/analyze', upload.single('image'), handleAnalysis);
app.post('/classify', upload.single('image'), handleAnalysis);

// Root routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local dev listener
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;