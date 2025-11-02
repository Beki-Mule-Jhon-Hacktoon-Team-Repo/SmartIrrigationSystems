const express = require("express");
const controller = require("../controllers/sensorController");

const router = express.Router();

router.post("/", controller.createSensor);
// Accept sensor telemetry POSTed to /:deviceId with body containing measurements
router.post("/:deviceId", (req, res) => {
  // forward to controller.createSensorData with deviceId param
  return controller.createSensorData(req, res);
});
router.get("/", controller.getSensors);
router.get("/device-status/:deviceId", controller.getDeviceStatus);
router.get("/:id", controller.getSensor);
router.patch("/:id", controller.updateSensor);
router.delete("/:id", controller.deleteSensor);

router.post("/sensor-data", (req, res) => {
  console.log("📥 Real-time data from Blynk:", req.body);

  // Example: store to DB or process
  // await db.insert(req.body);

  res.json({ status: "ok" });
});



router.post('/ingest', async (req, res) => {
  try {
    const { farmId, soilMoisture, temperature, humidity } = req.body;
    if (!farmId || soilMoisture === undefined) {
      return res.status(400).json({ error: 'Missing data' });
    }
    const sensorData = new Sensor({ farmId, soilMoisture, temperature, humidity });
    await sensorData.save();
    // Trigger AI prediction (see below)
    // require('../services/aiService').predictIrrigation(farmId);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
