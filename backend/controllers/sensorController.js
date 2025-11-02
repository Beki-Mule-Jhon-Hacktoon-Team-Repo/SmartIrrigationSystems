const Sensor = require('../models/sensorModel');
const Device = require('../models/deviceModel');
const IrrigationLog = require('../models/irrigationLogModel');

// Create a sensor reading
exports.createSensor = async (req, res) => {
  try {
    const doc = await Sensor.create(req.body);
    return res.status(201).json({ status: 'success', data: { sensor: doc } });
  } catch (err) {
    console.error('createSensor error:', err && err.message);
    return res
      .status(400)
      .json({ status: 'fail', message: err && err.message });
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
      sort = '-timestamp',
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
    console.error('getSensors error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get single sensor reading by id
exports.getSensor = async (req, res) => {
  try {
    const doc = await Sensor.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Sensor not found' });
    return res.status(200).json({ status: 'success', data: { sensor: doc } });
  } catch (err) {
    console.error('getSensor error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
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
        .json({ status: 'fail', message: 'Sensor not found' });
    return res.status(200).json({ status: 'success', data: { sensor: doc } });
  } catch (err) {
    console.error('updateSensor error:', err && err.message);
    return res
      .status(400)
      .json({ status: 'fail', message: err && err.message });
  }
};

// Delete sensor reading
exports.deleteSensor = async (req, res) => {
  try {
    const doc = await Sensor.findByIdAndDelete(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Sensor not found' });
    return res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    console.error('deleteSensor error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
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
