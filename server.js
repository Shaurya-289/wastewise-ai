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

// In-memory file storage (Required for serverless environments like Vercel)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Google Gemini API
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Core Classification Controller
const handleAnalysis = async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is missing from environment variables.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No image file uploaded.'
      });
    }

    // Use Gemini 1.5 Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert waste classification AI for India municipal segregation systems.
Analyze the image and respond ONLY with a raw, valid JSON object (do not wrap in markdown or backticks):
{
  "item": "Name of the detected object",
  "category": "DRY" or "WET" or "HAZARDOUS" or "E-WASTE",
  "bin": "Blue Bin" or "Green Bin" or "Red Bin" or "Special Handling",
  "recyclable": true,
  "confidence": 95,
  "hinglish_message": "A friendly, localized message in Hinglish explaining how to handle it",
  "tips": "Practical step-by-step disposal, safety, or cleaning tip",
  "impact": {
    "co2_avoided_kg": 0.25,
    "water_conserved_l": 1.5,
    "landfill_diverted_m2": 0.05
  }
}`;

    // Read directly from RAM buffer
    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype || 'image/jpeg'
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let responseText = result.response.text().trim();

    // Clean markdown code blocks if returned
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsedData = JSON.parse(responseText);
    return res.status(200).json(parsedData);
  } catch (error) {
    console.error('Classification error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process waste image classification.'
    });
  }
};

// Route definitions (supporting both endpoints)
app.post('/api/analyze', upload.single('image'), handleAnalysis);
app.post('/classify', upload.single('image'), handleAnalysis);

// Serve index.html on root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Local development server listener
const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`WasteWise AI server running locally on http://localhost:${PORT}`);
  });
}

// Export app for Vercel Serverless Functions
module.exports = app;