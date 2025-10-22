/***************************************************
 * server.js — Real Bin1 + Fictitious Bin2/Bin3 (new WL_* format)
 *
 * - Accepts POST /api/bins/data with:
 *   { binId, location, temperature, humidity, WL_GLASS, WL_UNCLASSIFIED, WL_METAL, WL_PAPER, WL_PLASTIC, WL_ORGANICS }
 * - Upserts doc per binId in MongoDB (Atlas)
 * - GET /api/bins returns frontend-friendly shape:
 *   { binId, location, temperature, humidity, wasteLevel: [Glass, Metal, Organic Waste, Paper, Plastic, Unclassified], timestamp }
 * - SSE /api/bins/stream pushes updates (same frontend shape)
 * - Keeps fictitious updates for bin2/bin3 using new WL_* fields
 ***************************************************/
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// CORS: adjust to your real frontend origin
app.use(cors({
  origin: 'https://smart-bin-frontend.onrender.com',
  methods: ['GET', 'POST'],
}));
app.use(express.json());

// MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://smartbin2025:jPW2dn9zivU2NTSw@smartbinscluster.kbmrc.mongodb.net/?retryWrites=true&w=majority&appName=SmartBinsCluster';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('connected', () => console.log('Connected to MongoDB Atlas!'));
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));

// Schema with new WL_* fields
const binReadingSchema = new mongoose.Schema({
  binId: { type: String, required: true }, // store as string ("01","bin2","bin3")
  location: { lat: Number, lng: Number },
  temperature: Number,
  humidity: Number,
  WL_GLASS: Number,
  WL_UNCLASSIFIED: Number,
  WL_METAL: Number,
  WL_PAPER: Number,
  WL_PLASTIC: Number,
  WL_ORGANICS: Number,
  timestamp: { type: Date, default: Date.now },
});
const BinReading = mongoose.model('BinReading', binReadingSchema);

// Helpers: map DB doc -> frontend payload
function toFrontendShape(doc) {
  // Order expected by your charts/details UI:
  // [Glass, Metal, Organic Waste, Paper, Plastic, Unclassified]
  const wasteLevel = [
    doc.WL_GLASS ?? 0,
    doc.WL_METAL ?? 0,
    doc.WL_ORGANICS ?? 0,
    doc.WL_PAPER ?? 0,
    doc.WL_PLASTIC ?? 0,
    doc.WL_UNCLASSIFIED ?? 0,
  ];
  return {
    binId: String(doc.binId),
    location: doc.location,
    temperature: doc.temperature,
    humidity: doc.humidity,
    wasteLevel,
    timestamp: doc.timestamp,
  };
}

// SSE clients
let sseClients = [];
app.get('/api/bins/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  sseClients.push(res);
  req.on('close', () => { sseClients = sseClients.filter(c => c !== res); });
});

// GET current (for map & details initial load)
app.get('/api/bins', async (req, res) => {
  try {
    const docs = await BinReading.find({});
    res.json(docs.map(toFrontendShape));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
});

// POST from PC script (Bin 1 real data) — new WL_* format
app.post('/api/bins/data', async (req, res) => {
  try {
    const {
      binId, location, temperature, humidity,
      WL_GLASS, WL_UNCLASSIFIED, WL_METAL, WL_PAPER, WL_PLASTIC, WL_ORGANICS,
      timestamp
    } = req.body;

    if (binId == null || location == null) {
      return res.status(400).json({ error: 'binId and location are required' });
    }
    const idString = String(binId);

    const updated = await BinReading.findOneAndUpdate(
      { binId: idString },
      {
        $set: {
          location, temperature, humidity,
          WL_GLASS, WL_UNCLASSIFIED, WL_METAL, WL_PAPER, WL_PLASTIC, WL_ORGANICS,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const payload = [toFrontendShape(updated)];
    sseClients.forEach(c => c.write(`data: ${JSON.stringify(payload)}\n\n`));
    res.json({ success: true, bin: toFrontendShape(updated) });
  } catch (e) {
    console.error('POST /api/bins/data error:', e);
    res.status(500).json({ error: 'Failed to upsert bin data' });
  }
});

// Root
app.get('/', (_req, res) => res.send('Smart Bin Backend: Bin1 real-time + Bin2/Bin3 simulated (WL_* format)'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

/* ------------------ Fictitious data for Bin 2 & Bin 3 (WL_* format) ------------------ */
const simBins = [
  { binId: 'bin2', location: { lat: 52.9300, lng: -1.1612 } },
  { binId: 'bin3', location: { lat: 52.9210, lng: -1.2157 } },
];

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

setInterval(async () => {
  // Simulate bin2/bin3 only (bin1 comes from Python)
  const now = new Date();
  for (const b of simBins) {
    const doc = {
      binId: b.binId,
      location: b.location,
      temperature: randomInt(20, 29),
      humidity: randomInt(45, 70),
      WL_GLASS: randomInt(0, 99),
      WL_UNCLASSIFIED: randomInt(0, 99),
      WL_METAL: randomInt(0, 99),
      WL_PAPER: randomInt(0, 99),
      WL_PLASTIC: randomInt(0, 99),
      WL_ORGANICS: randomInt(0, 99),
      timestamp: now,
    };
    try {
      const updated = await BinReading.findOneAndUpdate(
        { binId: doc.binId },
        { $set: doc },
        { upsert: true, new: true }
      );
      const payload = [toFrontendShape(updated)];
      sseClients.forEach(c => c.write(`data: ${JSON.stringify(payload)}\n\n`));
    } catch (e) {
      console.error(`Sim upsert error for ${b.binId}:`, e);
    }
  }
}, 10000);
