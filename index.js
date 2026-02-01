import "dotenv/config";
import express from 'express';
import multer from 'multer';
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();

app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const GEMINI_MODEL = "gemini-2.5-flash";

// Helper function sesuai materi
function extractText(resp) {
    try {
        if (resp?.text) return resp.text; // Cek cara cepat dulu
        if (resp?.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return resp.response.candidates[0].content.parts[0].text;
        }
        return JSON.stringify(resp);
    } catch (err) { return ""; }
}

// 1. Endpoint Teks (DIPERBAIKI)
app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;
  try {
    // Perbaikan: Langsung panggil ai.models.generateContent
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 2. Endpoint Gambar (DIPERBAIKI)
app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const { prompt } = req.body;
  if (!req.file) return res.status(400).json({ message: "Image is required" });

  const base64Data = req.file.buffer.toString("base64");
  try {
    // Perbaikan: Struktur parameter disesuaikan dengan SDK baru
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Jelaskan gambar ini" },
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ]
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 3. Endpoint Dokumen (PDF/TXT)
app.post("/generate-from-document", upload.single("document"), async (req, res) => {
  const { prompt } = req.body;
  // Cek file
  if (!req.file) return res.status(400).json({ message: "Document is required" });

  const base64Data = req.file.buffer.toString("base64");
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong buat ringkasan dari dokumen berikut." },
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ]
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// 4. Endpoint Audio (MP3/WAV)
app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const { prompt } = req.body;
  // Cek file
  if (!req.file) return res.status(400).json({ message: "Audio is required" });

  const base64Data = req.file.buffer.toString("base64");
  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        { text: prompt || "Tolong buatkan transkrip dari rekaman berikut." },
        { inlineData: { data: base64Data, mimeType: req.file.mimetype } }
      ]
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));