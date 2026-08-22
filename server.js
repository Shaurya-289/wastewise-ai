const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Use in-memory storage (Vercel serverless has a read-only disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Classification Endpoint
app.post('/classify', upload.single('image'), async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set in environment variables.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    // Use current Gemini 1.5 Flash model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze this waste item and respond STRICTLY with a valid JSON object (no markdown, no backticks, no extra text):
{
  "item": "Name of the item",
  "category": "DRY" or "WET" or "HAZARDOUS" or "E-WASTE",
  "bin": "Blue Bin" or "Green Bin" or "Red Bin" or "Special Handling",
  "recyclable": true or false,
  "confidence": 95,
  "hinglish_message": "A short, helpful message in conversational Hinglish",
  "tips": "Practical disposal or composting step",
  "impact": {
    "co2_avoided_kg": 0.25,
    "water_conserved_l": 1.5,
    "landfill_diverted_m2": 0.05
  }
}`;

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    let text = result.response.text().trim();

    // Strip markdown formatting if returned
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(text);
    return res.json(data);
  } catch (error) {
    console.error('Classification Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

// Local dev fallback
const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;