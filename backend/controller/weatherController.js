const axios = require('axios');
const API_KEY = process.env.OPENWEATHER_API_KEY;

exports.getWeather = async (req, res) => {
  try {
    const { city, units = 'metric' } = req.query;
    if (!city) return res.status(400).json({ error: 'City parameter is required' });

    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { q: city, units, appid: API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 404) return res.status(404).json({ error: 'City not found' });
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
};

exports.getForecast = async (req, res) => {
  try {
    const { city, units = 'metric' } = req.query;
    if (!city) return res.status(400).json({ error: 'City parameter is required' });

    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { q: city, units, appid: API_KEY }
    });

    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 404) return res.status(404).json({ error: 'City not found' });
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
};

exports.getAirQuality = async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'Latitude and longitude are required' });

    const response = await axios.get('https://api.openweathermap.org/data/2.5/air_pollution', {
      params: { lat, lon, appid: API_KEY }
    });

    res.json(response.data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch air quality data' });
  }
};