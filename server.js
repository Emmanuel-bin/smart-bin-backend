/***************************************************
 * server.js
 *
 * - Connects to MongoDB Atlas using Mongoose.
 * - Cycles through 10 sets of fictitious data every 10s,
 *   each containing data for 3 bins in Nottingham.
 * - Upserts each bin's current reading in the DB.
 * - Provides SSE endpoint (/api/bins/stream) for
 *   real-time updates to the frontend.
 * - Provides GET /api/bins/current to fetch the
 *   latest reading from DB for each bin if needed.
 ***************************************************/

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 1) Express & CORS
const app = express();
app.use(cors({
  origin: 'https://smart-bin-frontend.onrender.com', 
}));
app.use(express.json());

// 2) MongoDB Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://smartbin2025:jPW2dn9zivU2NTSw@smartbinscluster.kbmrc.mongodb.net/?retryWrites=true&w=majority&appName=SmartBinsCluster';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB Atlas!');
});
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// 3) Define Mongoose Schema/Model Once
const binReadingSchema = new mongoose.Schema({
  binId: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
  },
  temperature: Number,
  humidity: Number,
  wasteLevel: [Number],
  timestamp: { type: Date, default: Date.now },
});
const BinReading = mongoose.model('BinReading', binReadingSchema);

// 4) Ten Fictitious Data Sets (Each set has 3 bins)
const fictitiousSets = [
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 25.0,
      humidity: 60,
      wasteLevel: [10, 20, 30, 40, 50, 60],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 27.1,
      humidity: 55,
      wasteLevel: [5, 35, 65, 45, 20, 10],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 22.5,
      humidity: 65,
      wasteLevel: [2, 15, 40, 10, 60, 35],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 25.3,
      humidity: 61,
      wasteLevel: [15, 25, 35, 45, 55, 65],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 27.4,
      humidity: 53,
      wasteLevel: [10, 40, 70, 45, 20, 15],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 22.8,
      humidity: 64,
      wasteLevel: [5, 20, 42, 12, 63, 37],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 25.8,
      humidity: 62,
      wasteLevel: [16, 27, 38, 42, 57, 68],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 26.9,
      humidity: 54,
      wasteLevel: [12, 45, 72, 48, 25, 20],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 23.2,
      humidity: 66,
      wasteLevel: [8, 22, 45, 14, 65, 40],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 26.0,
      humidity: 59,
      wasteLevel: [18, 29, 39, 49, 60, 70],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 27.7,
      humidity: 58,
      wasteLevel: [15, 50, 75, 48, 27, 22],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 22.9,
      humidity: 63,
      wasteLevel: [9, 23, 46, 16, 67, 41],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 24.5,
      humidity: 64,
      wasteLevel: [20, 32, 45, 56, 63, 72],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 28.1,
      humidity: 52,
      wasteLevel: [18, 52, 78, 52, 30, 25],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 23.5,
      humidity: 67,
      wasteLevel: [10, 25, 48, 17, 68, 42],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 24.9,
      humidity: 63,
      wasteLevel: [22, 35, 50, 60, 65, 75],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 26.5,
      humidity: 56,
      wasteLevel: [20, 54, 80, 55, 32, 27],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 24.2,
      humidity: 62,
      wasteLevel: [12, 28, 50, 18, 70, 44],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 25.6,
      humidity: 61,
      wasteLevel: [24, 37, 52, 63, 66, 78],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 27.3,
      humidity: 57,
      wasteLevel: [23, 58, 83, 57, 34, 29],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 23.1,
      humidity: 68,
      wasteLevel: [14, 30, 52, 20, 72, 45],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 26.2,
      humidity: 60,
      wasteLevel: [26, 40, 55, 65, 70, 80],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 28.0,
      humidity: 54,
      wasteLevel: [25, 60, 85, 59, 36, 31],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 22.7,
      humidity: 66,
      wasteLevel: [16, 32, 55, 22, 75, 48],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 24.8,
      humidity: 65,
      wasteLevel: [28, 42, 57, 67, 72, 82],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 26.1,
      humidity: 58,
      wasteLevel: [28, 62, 88, 62, 38, 33],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 24.9,
      humidity: 61,
      wasteLevel: [18, 35, 58, 24, 77, 50],
    },
  ],
  [
    {
      binId: 'bin1',
      location: { lat: 52.9548, lng: -1.1581 },
      temperature: 25.5,
      humidity: 59,
      wasteLevel: [30, 45, 60, 70, 75, 85],
    },
    {
      binId: 'bin2',
      location: { lat: 52.9300, lng: -1.1612 },
      temperature: 27.8,
      humidity: 56,
      wasteLevel: [30, 65, 90, 64, 40, 35],
    },
    {
      binId: 'bin3',
      location: { lat: 52.9210, lng: -1.2157 },
      temperature: 23.3,
      humidity: 67,
      wasteLevel: [20, 37, 60, 26, 80, 55],
    },
  ],
];

let currentIndex = 0; // track which of the 10 sets is active

// Array of SSE clients
let sseClients = [];

// SSE endpoint => /api/bins/stream
app.get('/api/bins/stream', (req, res) => {
  // Setup SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);
  console.log('SSE client connected. Currently total:', sseClients.length);

  // Cleanup on client disconnect
  req.on('close', () => {
    sseClients = sseClients.filter((c) => c !== res);
    console.log('SSE client disconnected. Remaining:', sseClients.length);
  });
});

// GET /api/bins/current => returns the latest doc for each bin if needed
app.get('/api/bins/current', async (req, res) => {
  try {
    // if storing only one doc per bin, we can do:
    const bins = await BinReading.find({});
    // returns an array of docs with binId, location, etc.
    res.json(bins);
  } catch (err) {
    console.error('Error fetching bins:', err);
    res.status(500).json({ error: 'Failed to fetch bins' });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('Smart Bin Backend with Nottingham Data & MongoDB Realtime!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// setInterval => cycle every 10 seconds
setInterval(async () => {
  currentIndex = (currentIndex + 1) % fictitiousSets.length;
  const dataSet = fictitiousSets[currentIndex];

  // Upsert each bin reading in the DB
  for (const reading of dataSet) {
    try {
      await BinReading.findOneAndUpdate(
        { binId: reading.binId },
        {
          $set: {
            location: reading.location,
            temperature: reading.temperature,
            humidity: reading.humidity,
            wasteLevel: reading.wasteLevel,
            timestamp: new Date(),
          },
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.error(`Error upserting bin ${reading.binId}:`, err);
    }
  }

  console.log(`Updated DB with set #${currentIndex}.`);

  // Broadcast to SSE clients
  const payload = JSON.stringify(dataSet);
  sseClients.forEach((client) => {
    client.write(`data: ${payload}\n\n`);
  });
}, 10000);
