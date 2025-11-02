
const Sensor = require('../models/sensorModel');
const Device = require('../models/deviceModel');
const IrrigationLog = require('../models/irrigationLogModel');
const SensorData = require("../models/sensorDataModel");
const User = require("../models/userModel");
const admin = require("firebase-admin");


// Create a sensor reading
exports.createSensor = async (req, res) => {
  try {
    // Normalize incoming payload to expected schema types
    const body = req.body || {};
    const sensorData = {};

    // Basic identifiers
    if (body.sensorId) sensorData.sensorId = String(body.sensorId);
    if (body.farmId) sensorData.farmId = String(body.farmId);

    // Numeric fields (coerce where possible)
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    sensorData.temperature = toNum(body.temperature ?? body.temp ?? null);
    sensorData.humidity = toNum(body.humidity ?? null);
    sensorData.soilMoisture = toNum(body.soilMoisture ?? body.soil ?? null);
    // accept pump as '1'/'0' or boolean
    if (body.pump !== undefined) {
      const p =
        body.pump === true || body.pump === 1 || body.pump === "1" ? 1 : 0;
      sensorData.pump = p;
    }
    sensorData.ph = toNum(body.ph ?? null);
    sensorData.npk = toNum(body.npk ?? body.NPK ?? null);

    // Attach owner automatically if Authorization header present and Firebase Admin initialized
    try {
      const authHeader = req.headers.authorization || "";
      const m = authHeader.match(/^Bearer\s+(.+)$/i);
      if (m && admin?.apps?.length > 0) {
        const idToken = m[1];
        const decoded = await admin
          .auth()
          .verifyIdToken(idToken)
          .catch(() => null);
        if (decoded && decoded.uid) {
          const localUser = await User.findOne({
            firebaseUid: decoded.uid,
          }).select("_id");
          if (localUser) sensorData.owner = localUser._id;
        }
      }
    } catch (e) {
      // ignore owner attach errors
      console.warn("Could not attach owner to sensor data:", e && e.message);
    }

    // Timestamp if provided
    if (body.timestamp) sensorData.timestamp = new Date(body.timestamp);

    // meta - store the raw payload for debugging
    sensorData.meta = Object.assign({}, body.meta || {}, { raw: body });

    const doc = await Sensor.create(sensorData);
    return res.status(201).json({ status: "success", data: { sensor: doc } });
  } catch (err) {
    console.error("createSensor error:", err && err.message);
    return res
      .status(400)
      .json({ status: "fail", message: err && err.message });
  }
};

// Create a sensor telemetry record (separate model)
exports.createSensorData = async (req, res) => {
  try {
    const body = req.body || {};
    const data = {};
    if (req.params && req.params.deviceId)
      data.sensorId = String(req.params.deviceId);
    if (body.farmId) data.farmId = String(body.farmId);

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    data.temperature = toNum(body.temperature ?? body.temp ?? null);
    data.humidity = toNum(body.humidity ?? null);
    data.soil = toNum(body.soil ?? body.soilMoisture ?? null);
    if (body.pump !== undefined)
      data.pump =
        body.pump === true || body.pump === 1 || body.pump === "1" ? 1 : 0;
    data.ph = toNum(body.ph ?? null);
    data.npk = toNum(body.npk ?? body.NPK ?? null);

    // Attach owner if possible
    try {
      const authHeader = req.headers.authorization || "";
      const m = authHeader.match(/^Bearer\s+(.+)$/i);
      if (m && admin?.apps?.length > 0) {
        const idToken = m[1];
        const decoded = await admin
          .auth()
          .verifyIdToken(idToken)
          .catch(() => null);
        if (decoded && decoded.uid) {
          const localUser = await User.findOne({
            firebaseUid: decoded.uid,
          }).select("_id");
          if (localUser) data.owner = localUser._id;
        }
      }
    } catch (e) {
      console.warn("Could not attach owner to sensor data:", e && e.message);
    }

    if (body.timestamp) data.timestamp = new Date(body.timestamp);
    data.meta = Object.assign({}, body.meta || {}, { raw: body });

    const doc = await SensorData.create(data);
    return res
      .status(201)
      .json({ status: "success", data: { sensorData: doc } });
  } catch (err) {
    console.error("createSensorData error:", err && err.message);
    return res
      .status(400)
      .json({ status: "fail", message: err && err.message });
  }
};

// List sensor readings with optional filters: farmId, sensorId, from, to, page, limit
exports.getSensors = async (req, res) => {
  try {
    const {
      farmId,
      sensorId,
      from,
      to,
      page = 1,
      limit = 50,
      sort = "-timestamp",
    } = req.query;
    const filter = {};
    if (farmId) filter.farmId = farmId;
    if (sensorId) filter.sensorId = sensorId;
    if (from || to) filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const docs = await Sensor.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));
    return res.status(200).json({

      status: 'success',
      results: docs.length,
      data: { sensors: docs },
    });
  } catch (err) {
    console.error("getSensors error:", err && err.message);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// Get single sensor reading by id
exports.getSensor = async (req, res) => {
  try {
    const doc = await Sensor.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: "fail", message: "Sensor not found" });
    return res.status(200).json({ status: "success", data: { sensor: doc } });
  } catch (err) {
    console.error("getSensor error:", err && err.message);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// Update sensor reading
exports.updateSensor = async (req, res) => {
  try {
    const doc = await Sensor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return res
        .status(404)
        .json({ status: "fail", message: "Sensor not found" });
    return res.status(200).json({ status: "success", data: { sensor: doc } });
  } catch (err) {
    console.error("updateSensor error:", err && err.message);
    return res
      .status(400)
      .json({ status: "fail", message: err && err.message });
  }
};

// Delete sensor reading
exports.deleteSensor = async (req, res) => {
  try {
    const doc = await Sensor.findByIdAndDelete(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: "fail", message: "Sensor not found" });
    return res.status(204).json({ status: "success", data: null });
  } catch (err) {
    console.error("deleteSensor error:", err && err.message);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// Get device status by deviceId
exports.getDeviceStatus = async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    return res.status(200).json({
      deviceId: deviceId,
      registered: true,
      status: "active",
      farmerId: "farmer123",
    });
  } catch (err) {
    console.error("getDeviceStatus error:", err && err.message);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// POST /api/v1/sensor/data  (mounted path shown in routes)
exports.receiveSensorData = async (req, res) => {
  try {
    const {
      deviceId,
      temperature,
      humidity,
      soilMoisture,
      pH,
      npk,
      pumpStatus,
    } = req.body;

    if (!deviceId) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'deviceId is required' });
    }

    // Save sensor data
    const data = new SensorData({
      deviceId,
      temperature,
      humidity,
      soilMoisture,
      pH,
      npk,
      pumpStatus,
    });
    await data.save();

    // Update device last seen (create device doc if not exist)
    await Device.updateOne(
      { deviceId },
      { $set: { lastSeen: new Date() } },
      { upsert: true }
    );

    // Log pump change (compare previous record)
    const last = await Sensor.findOne({ deviceId }).sort({ createdAt: -2 });
    if (
      last &&
      typeof last.pumpStatus !== 'undefined' &&
      last.pumpStatus !== pumpStatus
    ) {
      await new IrrigationLog({
        deviceId,
        action: pumpStatus ? 'start' : 'stop',
        triggeredBy: 'auto', // or 'manual' if provided by client
      }).save();
    }

    // AI Prediction (fire-and-forget)
    // if (typeof predictIrrigation === 'function') {
    //   predictIrrigation(deviceId).catch((e) =>
    //     console.error('predictIrrigation error:', e && e.message)
    //   );
    // }

    return res.status(201).json({ status: 'success', data: { saved: true } });
  } catch (err) {
    console.error('Sensor data error:', err && err.message);
    return res
      .status(500)
      .json({ status: 'error', message: err && err.message });
  }
};

// GET /api/v1/sensor/latest/:deviceId
exports.getLatestData = async (req, res) => {
  try {
    const data = await SensorData.findOne({
      deviceId: req.params.deviceId,
    }).sort({ createdAt: -1 });
    return res.status(200).json({ status: 'success', data: data || {} });
  } catch (err) {
    console.error('getLatestData error:', err && err.message);
    return res
      .status(500)
      .json({ status: 'error', message: err && err.message });
  }
};
