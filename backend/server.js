// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Weather API endpoint
app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    const API_KEY = '869510cc66a5b19d4f3bca91e854bb21';
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    console.log(`Fetching weather for: ${city}`); // Debug log

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: city,
        units: 'metric',
        appid: API_KEY
      }
    });
    
    console.log('OpenWeatherMap response status:', response.status); // Debug log
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'City not found' });
    }
    
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});