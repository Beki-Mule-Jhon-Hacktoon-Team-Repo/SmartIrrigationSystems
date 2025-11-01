const Sensor = require("../models/sensorModel");

// Create a sensor reading
exports.createSensor = async (req, res) => {
  try {
    const doc = await Sensor.create(req.body);
    return res.status(201).json({ status: "success", data: { sensor: doc } });
  } catch (err) {
    console.error("createSensor error:", err && err.message);
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
      status: "success",
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
