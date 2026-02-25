const express = require('express');
const router = express.Router();
const weatherController = require('../controller/weatherController');

router.get('/weather', weatherController.getWeather);
router.get('/forecast', weatherController.getForecast);
router.get('/air-quality', weatherController.getAirQuality);

module.exports = router;