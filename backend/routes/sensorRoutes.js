

const express = require("express");
const controller = require("../controllers/sensorController");

const router = express.Router();

router.post("/", controller.createSensor);
router.get("/", controller.getSensors);
router.get("/device-status/:deviceId", controller.getDeviceStatus);
router.get("/:id", controller.getSensor);
router.patch("/:id", controller.updateSensor);
router.delete("/:id", controller.deleteSensor);

router.post("/blynk-data", (req, res) => {
  console.log("📥 Real-time data from Blynk:", req.body);

  // Example: store to DB or process
  // await db.insert(req.body);

  res.json({ status: "ok" });
});

module.exports = router;
