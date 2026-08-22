const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory buffer storage for Vercel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

const handleAnalysis = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const prompt = `You are an expert waste classification AI for India municipal segregation systems.
Analyze the image and respond ONLY with a raw JSON object (no markdown, no backticks):
{
  "item": "Name of the detected object",
  "category": "DRY",
  "bin": "Blue Bin",
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

    const mimeType = req.file.mimetype || 'image/jpeg';
    const base64Data = req.file.buffer.toString('base64');

    // Models to try in priority order
    const candidateModels = ['gemini-3.5-flash'];
    let lastError = null;
    let rawText = '';

    for (const model of candidateModels) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: prompt },
                    {
                      inline_data: {
                        mime_type: mimeType,
                        data: base64Data
                      }
                    }
                  ]
                }
              ]
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || `API error ${response.status}`);
        }

        rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText) break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!rawText) {
      throw lastError || new Error('Failed to generate response from Gemini API.');
    }

    // Clean JSON markdown
    let cleaned = rawText.trim();
    if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    else if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');

    return res.status(200).json(JSON.parse(cleaned));
  } catch (error) {
    console.error('Processing error:', error);
    return res.status(500).json({ error: error.message || 'Classification failed' });
  }
};

app.post('/api/analyze', upload.single('image'), handleAnalysis);
app.post('/classify', upload.single('image'), handleAnalysis);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
if (!process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
}

module.exports = app;