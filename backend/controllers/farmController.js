const Farm = require('../models/farmModel');

// List farms (supports page, limit, q for search)
exports.listFarms = async (req, res) => {
  try {
    const { page = 1, limit = 50, q, sort = '-createdAt' } = req.query;
    const filter = {};
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ name: re }, { location: re }, { description: re }];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const docs = await Farm.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const total = await Farm.countDocuments(filter);
    return res.status(200).json({
      status: 'success',
      results: docs.length,
      total,
      data: { farms: docs },
    });
  } catch (err) {
    console.error('listFarms error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Create a new farm
exports.createFarm = async (req, res) => {
  try {
    const { name, owner, location, size, litresSaved, status, description } =
      req.body;
    if (!name)
      return res
        .status(400)
        .json({ status: 'fail', message: 'name is required' });
    const farm = await Farm.create({
      name,
      owner,
      location,
      size,
      litresSaved,
      status,
      description,
    });
    return res.status(201).json({ status: 'success', data: { farm } });
  } catch (err) {
    console.error('createFarm error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get single farm by id
exports.getFarm = async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id).lean();
    if (!farm)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Farm not found' });
    return res.status(200).json({ status: 'success', data: { farm } });
  } catch (err) {
    console.error('getFarm error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update farm
exports.updateFarm = async (req, res) => {
  try {
    const updates = req.body || {};
    const farm = await Farm.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!farm)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Farm not found' });
    return res.status(200).json({ status: 'success', data: { farm } });
  } catch (err) {
    console.error('updateFarm error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Delete farm
exports.deleteFarm = async (req, res) => {
  try {
    const removed = await Farm.findByIdAndDelete(req.params.id);
    if (!removed)
      return res
        .status(404)
        .json({ status: 'fail', message: 'Farm not found' });
    return res.status(204).json({ status: 'success', data: null });
  } catch (err) {
    console.error('deleteFarm error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
