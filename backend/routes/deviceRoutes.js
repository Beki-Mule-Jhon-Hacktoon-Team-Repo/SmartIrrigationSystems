// routes/deviceRoute.js
const express = require('express');
const router = express.Router();
const {
  registerDevicePage,
  getDeviceStatus,
  activateDevice,
} = require('../controllers/deviceController');

// QR Code lands here
router.get('/register', registerDevicePage);

// Arduino polls this
router.get('/status/:deviceId', getDeviceStatus);

// Admin UI or QR page calls this
router.post('/activate', activateDevice);

module.exports = router;
