// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Fictitious data for 3 smart bins in Nottingham
const binsData = [
  {
    binId: 'bin1',
    location: { lat: 52.9548, lng: -1.1581 }, // Nottingham City Centre
    temperature: 25.5,
    humidity: 60,
    wasteLevel: [30, 45, 15, 90, 10, 60], // 6 compartments
  },
  {
    binId: 'bin2',
    location: { lat: 52.9300, lng: -1.1612 }, // Wollaton Park Area
    temperature: 27,
    humidity: 55,
    wasteLevel: [50, 20, 80, 45, 70, 10],
  },
  {
    binId: 'bin3',
    location: { lat: 52.9210, lng: -1.2157 }, // Beeston Town Centre
    temperature: 22,
    humidity: 65,
    wasteLevel: [5, 95, 40, 10, 60, 35],
  },
];

// Root endpoint
app.get('/', (req, res) => {
  res.send('Smart Bin Backend with Nottingham Data!');
});

// New GET endpoint to retrieve bins data
app.get('/api/bins', (req, res) => {
  res.json(binsData);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
