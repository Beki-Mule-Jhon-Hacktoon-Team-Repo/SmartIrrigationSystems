const express = require('express');
const controller = require('../controllers/sensorController');

const router = express.Router();

router.post('/', controller.createSensor);
router.get('/', controller.getSensors);
router.get('/:id', controller.getSensor);
router.patch('/:id', controller.updateSensor);
router.delete('/:id', controller.deleteSensor);

module.exports = router;
