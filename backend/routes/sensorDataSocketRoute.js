const express = require("express");
const SensorData = require("../models/sensorDatasModel");

module.exports = function createSensorDataRouter({ io } = {}) {
  if (!io) throw new Error("socket.io instance (io) is required");

  const router = express.Router();

  const isValidNumber = (v) => typeof v === "number" && Number.isFinite(v);

  // helper: parse pump value (accept "1"/"0", boolean, number)
  const parsePump = (v) => {
    if (v === undefined || v === null) return null;
    if (typeof v === "number") return v === 1 ? 1 : v === 0 ? 0 : null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "1" || s === "true") return 1;
      if (s === "0" || s === "false") return 0;
    }
    return null;
  };

  // POST /sensor/:deviceId
  router.post("/sensor/:deviceId", async (req, res) => {
    const { deviceId } = req.params;
    const payload = req.body || {};

    // Map sensorId: prefer explicit payload.sensorId, otherwise use deviceId
    const sensorId = payload.sensorId || deviceId;

    // Validate payload
    if (
      !isValidNumber(payload.temperature) ||
      !isValidNumber(payload.humidity) ||
      !isValidNumber(payload.soil) ||
      !isValidNumber(payload.ph) ||
      !isValidNumber(payload.npk)
    ) {
      return res.status(400).json({
        error:
          "Invalid payload. Expect numeric temperature, humidity, soil, ph, npk.",
      });
    }

    // parse pump (optional)
    const pumpVal = parsePump(payload.pump);

    const record = {
      // include both fields so models that expect deviceId or sensorId work
      deviceId,
      sensorId, // <- ensure model requiring sensorId receives it
      temperature: payload.temperature,
      humidity: payload.humidity,
      soil: payload.soil,
      ph: payload.ph,
      npk: payload.npk,
      // include pump only when parsed successfully (0 or 1)
      ...(pumpVal !== null ? { pump: pumpVal } : {}),
      receivedAt: new Date(),
      meta: payload.meta || {},
    };

    try {
      const saved = await new SensorData(record).save();

      // Broadcast to clients joined to room `device:<deviceId>` (and sensor:<sensorId> for compatibility)
      const roomDevice = `device:${deviceId}`;
      const roomSensor = `sensor:${sensorId}`;
      io.to(roomDevice).emit("device-data", saved);
      io.to(roomSensor).emit("device-data", saved);

      // optional global event
      io.emit("device-data-all", { deviceId, sensorId, data: saved });

      return res.status(201).json({ ok: true, data: saved });
    } catch (err) {
      // If mongoose validation error, return concise messages
      if (err && err.name === "ValidationError" && err.errors) {
        const messages = Object.values(err.errors).map((e) => e.message);
        console.error("Validation failed saving sensor data:", messages);
        return res
          .status(400)
          .json({ error: "Validation failed", details: messages });
      }
      console.error("Failed to save sensor data:", err);
      return res.status(500).json({ error: "Failed to save data" });
    }
  });

  // New: GET /sensor/:deviceId/test-emit
  // Emits a sample payload to the same rooms used by POST so you can test realtime flow
  router.get("/sensor/:deviceId/test-emit", (req, res) => {
    const { deviceId } = req.params;
    const sensorId = req.query.sensorId || deviceId;

    const sample = {
      deviceId,
      sensorId,
      temperature: 25.5,
      humidity: 55,
      soil: 40,
      ph: 6.8,
      npk: 10,
      pump: 1, // sample pump state (1 = on)
      receivedAt: new Date(),
      meta: { test: true },
    };

    const roomDevice = `device:${deviceId}`;
    const roomSensor = `sensor:${sensorId}`;

    io.to(roomDevice).emit("device-data", sample);
    io.to(roomSensor).emit("device-data", sample);
    io.emit("device-data-all", { deviceId, sensorId, data: sample });

    return res.json({ ok: true, emitted: sample });
  });

  return router;
};
