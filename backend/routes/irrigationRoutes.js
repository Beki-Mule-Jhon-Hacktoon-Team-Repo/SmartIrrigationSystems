const express = require('express');
const controller = require('../controllers/irrigationController');

const router = express.Router();

router.post('/', controller.createIrrigation);
router.get('/', controller.getIrrigations);
router.get('/:id', controller.getIrrigation);
router.patch('/:id', controller.updateIrrigation);
router.delete('/:id', controller.deleteIrrigation);


router.post('/command', async (req, res) => {
  const { farmId, action } = req.body;
  // Send MQTT command to Arduino
  const mqtt = require('mqtt');
  const client = mqtt.connect('mqtt://broker.hivemq.com');
  client.publish(`arduino/${farmId}/command`, JSON.stringify({ action }));
  res.json({ success: true });
});

module.exports = router;
