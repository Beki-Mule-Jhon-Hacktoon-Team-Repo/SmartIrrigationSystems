const express = require('express');
const controller = require('../controllers/weatherController');

const router = express.Router();

router.post('/', controller.createWeather);
router.get('/', controller.getWeather);
router.get('/:id', controller.getWeatherById);
router.patch('/:id', controller.updateWeather);
router.delete('/:id', controller.deleteWeather);

module.exports = router;
