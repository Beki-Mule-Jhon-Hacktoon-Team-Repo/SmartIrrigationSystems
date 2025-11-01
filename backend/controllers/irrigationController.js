const Irrigation = require('../models/irrigationModel');

// Create irrigation event
exports.createIrrigation = async (req, res) => {
  try {
    const doc = await Irrigation.create(req.body);
    return res
      .status(201)
      .json({ status: 'success', data: { irrigation: doc } });
  } catch (err) {
    console.error('createIrrigation error:', err && err.message);
    return res
      .status(400)
      .json({ status: 'fail', message: err && err.message });
  }
};

// List irrigation events (farmId, from, to, page, limit)
exports.getIrrigations = async (req, res) => {
  try {
    const {
      farmId,
      from,
      to,
      page = 1,
      limit = 50,
      sort = '-startTime',
    } = req.query;
    const filter = {};
    if (farmId) filter.farmId = farmId;
    if (from || to) filter.startTime = {};
    if (from) filter.startTime.$gte = new Date(from);
    if (to) filter.startTime.$lte = new Date(to);

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const docs = await Irrigation.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));
    return res
      .status(200)
      .json({
        status: 'success',
        results: docs.length,
        data: { irrigations: docs },
      });
  } catch (err) {
    console.error('getIrrigations error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get irrigation by id
exports.getIrrigation = async (req, res) => {
  try {
    const doc = await Irrigation.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Irrigation not found' });
    return res
      .status(200)
      .json({ status: 'success', data: { irrigation: doc } });
  } catch (err) {
    console.error('getIrrigation error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update irrigation (compute duration if endTime provided)
exports.updateIrrigation = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.endTime && !updates.durationSeconds && updates.startTime) {
      const diff =
        (new Date(updates.endTime).getTime() -
          new Date(updates.startTime).getTime()) /
        1000;
      updates.durationSeconds = diff > 0 ? Math.round(diff) : 0;
    }
    const doc = await Irrigation.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Irrigation not found' });
    return res
      .status(200)
      .json({ status: 'success', data: { irrigation: doc } });
  } catch (err) {
    console.error('updateIrrigation error:', err && err.message);
    return res
      .status(400)
      .json({ status: 'fail', message: err && err.message });
  }
};

// Delete irrigation
exports.deleteIrrigation = async (req, res) => {
  try {
    const doc = await Irrigation.findByIdAndDelete(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Irrigation not found' });
    return res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    console.error('deleteIrrigation error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
