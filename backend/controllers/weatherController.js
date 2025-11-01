const Weather = require('../models/weatherModel');

// Create weather entry
exports.createWeather = async (req, res) => {
  try {
    const doc = await Weather.create(req.body);
    return res.status(201).json({ status: 'success', data: { weather: doc } });
  } catch (err) {
    console.error('createWeather error:', err && err.message);
    return res
      .status(400)
      .json({ status: 'fail', message: err && err.message });
  }
};

// List weather entries with optional filters: farmId, from, to, page, limit
exports.getWeather = async (req, res) => {
  try {
    const {
      farmId,
      from,
      to,
      page = 1,
      limit = 50,
      sort = '-timestamp',
    } = req.query;
    const filter = {};
    if (farmId) filter.farmId = farmId;
    if (from || to) filter.timestamp = {};
    if (from) filter.timestamp.$gte = new Date(from);
    if (to) filter.timestamp.$lte = new Date(to);

    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const docs = await Weather.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));
    return res
      .status(200)
      .json({
        status: 'success',
        results: docs.length,
        data: { weather: docs },
      });
  } catch (err) {
    console.error('getWeather error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get single weather entry by id
exports.getWeatherById = async (req, res) => {
  try {
    const doc = await Weather.findById(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Weather entry not found' });
    return res.status(200).json({ status: 'success', data: { weather: doc } });
  } catch (err) {
    console.error('getWeatherById error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update weather entry
exports.updateWeather = async (req, res) => {
  try {
    const doc = await Weather.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Weather entry not found' });
    return res.status(200).json({ status: 'success', data: { weather: doc } });
  } catch (err) {
    console.error('updateWeather error:', err && err.message);
    return res
      .status(400)
      .json({ status: 'fail', message: err && err.message });
  }
};

// Delete weather entry
exports.deleteWeather = async (req, res) => {
  try {
    const doc = await Weather.findByIdAndDelete(req.params.id);
    if (!doc)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Weather entry not found' });
    return res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    console.error('deleteWeather error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
