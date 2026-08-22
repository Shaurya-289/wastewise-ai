const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

const upload = multer({ dest: path.join(__dirname, 'uploads/') });
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGeminiWithRetry(model, payload, apiKey, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();
    if (res.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return JSON.parse(data.candidates[0].content.parts[0].text);
    }

    const errMsg = data.error?.message || `HTTP ${res.status}`;
    const isTransient = res.status === 503 || res.status === 429 || errMsg.includes('high demand') || errMsg.includes('Overloaded');

    if (isTransient && attempt < maxRetries) {
      await sleep(attempt * 1500);
      continue;
    }
    throw new Error(`[${model}] ${errMsg}`);
  }
}

app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing from .env' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';
    fs.unlink(req.file.path, () => {});

    const prompt = `You are an expert waste classification and safety AI. Classify the discarded item into one of THREE strict handling tiers:

1. "normal" (🟢 Normal / Recyclable): Paper, cardboard, clean plastics, cans, bottles, food scraps, clean glass, organic waste.
2. "special" (🟡 Special Handling): Items requiring special separation, bulky handling, degreasing, or non-hazardous special facilities (e.g. Styrofoam/Thermocol, textiles/clothes, tires, mattress foam, composite cartons/Tetra Pak, cords/wires, large ceramics).
3. "hazardous" (🔴 Hazardous): Batteries, chemicals, paint, engine oil, medicines, pesticides, CFL bulbs, mercury tubes, biomedical waste, syringes, toxic electronic waste.

Return a valid JSON object matching this schema:
{
  "name": "Specific item name",
  "handlingTier": "normal" | "special" | "hazardous",
  "category": "Must be one of: Organic (Biodegradable) | Recyclable (Dry Solid) | Special Handling Waste | Hazardous Waste | Electronic Waste (E-Waste) | Biomedical / Clinical | Non-Recyclable Solid | Liquid Waste",
  "wasteType": "Wet Waste" | "Dry Waste",
  "warningMessage": "Short caution message if special or hazardous (or null if normal)",
  "primaryManagement": "Concise disposal instruction",
  "confidence": 97.5,
  "steps": ["Step 1", "Step 2", "Step 3"],
  "co2": 0.25,
  "water": 3.5,
  "land": 0.04,
  "isRecyclable": boolean,
  "ecoScoreReward": 30,
  "facts": [
    {"title": "Material Fact", "text": "Specific fact"},
    {"title": "Disposal Fact", "text": "Handling fact"}
  ]
}`;

    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const models = ['gemini-3.7-flash', 'gemini-3.6-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const result = await callGeminiWithRetry(model, payload, apiKey);
        return res.json(result);
      } catch (err) {
        lastError = err.message;
      }
    }

    throw new Error(lastError || 'Classification failed across active models.');
  } catch (err) {
    console.error('Classification error:', err);
    res.status(500).json({ error: err.message || 'Failed to classify image' });
  }
});

app.listen(port, () => {
  console.log(`WasteWise server listening at http://localhost:${port}`);
});