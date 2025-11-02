const adminSdk = require('firebase-admin');
const User = require('../models/userModel');
const Farm = require('../models/farmModel');

// helper: admin roles
const isAdminRole = (role) => ['admin', 'superadmin'].includes(role);

// Middleware: adminAuth (accepts Firebase idToken or header creds)
exports.adminAuth = async (req, res, next) => {
  try {
    // Try Firebase idToken
    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match) {
      const idToken = match[1];
      if (!adminSdk.apps || adminSdk.apps.length === 0) {
        return res
          .status(500)
          .json({ status: 'error', message: 'Firebase admin not initialized' });
      }
      try {
        const decoded = await adminSdk.auth().verifyIdToken(idToken);
        const { uid, email } = decoded;
        let user = null;
        if (uid)
          user = await User.findOne({ firebaseUid: uid }).select('+password');
        if (!user && email)
          user = await User.findOne({ email }).select('+password');
        if (!user)
          return res
            .status(401)
            .json({ status: 'fail', message: 'Admin user not found' });
        if (!isAdminRole(user.role))
          return res
            .status(403)
            .json({ status: 'fail', message: 'Not authorized' });
        req.adminUser = user;
        return next();
      } catch (err) {
        console.error('Firebase adminAuth verify failed:', err && err.message);
        return res
          .status(401)
          .json({ status: 'fail', message: 'Invalid idToken' });
      }
    }

    // Fallback: header email/password
    const email = req.headers['x-admin-email'];
    const password = req.headers['x-admin-password'];
    if (email && password) {
      const user = await User.findOne({ email }).select('+password');
      if (!user)
        return res
          .status(401)
          .json({ status: 'fail', message: 'Invalid admin credentials' });
      const ok = await user.correctPassword(password, user.password);
      if (!ok)
        return res
          .status(401)
          .json({ status: 'fail', message: 'Invalid admin credentials' });
      if (!isAdminRole(user.role))
        return res
          .status(403)
          .json({ status: 'fail', message: 'Not authorized' });
      req.adminUser = user;
      return next();
    }

    return res
      .status(401)
      .json({ status: 'fail', message: 'Admin credentials required' });
  } catch (err) {
    console.error('adminAuth error:', err && err.stack);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Create user (admin)
exports.addUser = async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ status: 'fail', message: 'email and password required' });

    const exists = await User.findOne({ email });
    if (exists)
      return res
        .status(400)
        .json({ status: 'fail', message: 'User already exists' });

    // Optionally create Firebase user if adminSdk initialized
    let firebaseUid = null;
    if (adminSdk.apps && adminSdk.apps.length > 0) {
      try {
        const fbUser = await adminSdk
          .auth()
          .createUser({ email, password, displayName: name });
        firebaseUid = fbUser.uid;
      } catch (fbErr) {
        console.warn('Firebase createUser warning:', fbErr && fbErr.message);
        if (fbErr && fbErr.code === 'auth/email-already-exists') {
          try {
            const existing = await adminSdk.auth().getUserByEmail(email);
            firebaseUid = existing.uid;
          } catch (e) {}
        }
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      firebaseUid,
    });
    user.password = undefined;
    return res.status(201).json({ status: 'success', data: { user } });
  } catch (err) {
    console.error('addUser error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// List users (pagination/search)
exports.listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = {};
    if (q)
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
      ];
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    return res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      data: { users },
    });
  } catch (err) {
    console.error('listUsers error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Admin: list farms (pagination & optional search by name/location)
exports.listFarmers = async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = {};
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const total = await User.countDocuments(filter);
    return res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      data: { users },
    });
  } catch (err) {
    console.error('listFarmers error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// ------------------- UPDATED: list only regular users (role === 'user') -------------------
exports.listRegularUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = { role: 'user' };
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    // Fetch users (no reliance on User.farms array)
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // If no users return early
    if (!Array.isArray(users) || users.length === 0) {
      const totalEmpty = await User.countDocuments({ role: 'user' });
      return res.status(200).json({
        status: 'success',
        results: 0,
        total: totalEmpty,
        data: { users: [] },
      });
    }

    // Collect user ids and fetch farms owned by them
    const userIds = users.map((u) => u._id);
    const farms = await Farm.find({ owner: { $in: userIds } })
      .select('owner location size litresSaved status')
      .lean();

    // Group farms by owner id
    const farmsByOwner = farms.reduce((acc, f) => {
      const oid = String(f.owner);
      if (!acc[oid]) acc[oid] = [];
      acc[oid].push(f);
      return acc;
    }, {});

    // compute additional lightweight summary fields per user using grouped farms
    const mapped = users.map((u) => {
      const uid = String(u._id);
      const owned = farmsByOwner[uid] || [];
      const farmsCount = owned.length;
      const totalLitresSaved = owned.reduce(
        (acc, f) =>
          acc + (f && typeof f.litresSaved === 'number' ? f.litresSaved : 0),
        0
      );
      const primaryLocation =
        owned.length > 0 && owned[0].location
          ? owned[0].location
          : u.location || '—';
      return {
        ...u,
        farmsCount,
        totalLitresSaved,
        primaryLocation,
      };
    });

    const total = await User.countDocuments(filter);
    return res.status(200).json({
      status: 'success',
      results: mapped.length,
      total,
      data: { users: mapped },
    });

  } catch (err) {
    console.error('listRegularUsers error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Admin: list farms (pagination & optional search by name/location)
exports.listFarmers = async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = {};
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const total = await User.countDocuments(filter);
    return res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      data: { users },
    });
  } catch (err) {
    console.error('listFarmers error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// ------------------- NEW: list only regular users (role === 'user') -------------------
exports.listRegularUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, q } = req.query;
    const filter = { role: 'user' };
    if (q) {
      const re = new RegExp(String(q), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(Number(limit))
      .lean();
    const total = await User.countDocuments(filter);
    return res.status(200).json({
      status: 'success',
      results: users.length,
      total,
      data: { users },
    });
  } catch (err) {
    console.error('listRegularUsers error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Get user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user)
      return res
        .status(404)
        .json({ status: 'fail', message: 'User not found' });
    return res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    console.error('getUser error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      const user = await User.findById(req.params.id).select('+password');
      if (!user)
        return res
          .status(404)
          .json({ status: 'fail', message: 'User not found' });
      user.name = updates.name || user.name;
      user.email = updates.email || user.email;
      user.role = updates.role || user.role;
      user.password = updates.password;
      await user.save();
      user.password = undefined;
      return res.status(200).json({ status: 'success', data: { user } });
    } else {
      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      }).select('-password');
      if (!user)
        return res
          .status(404)
          .json({ status: 'fail', message: 'User not found' });
      return res.status(200).json({ status: 'success', data: { user } });
    }
  } catch (err) {
    console.error('updateUser error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// Delete user (soft by default)
exports.deleteUser = async (req, res) => {
  try {
    const hard = req.query.hard === 'true';
    if (hard) {
      const removed = await User.findByIdAndDelete(req.params.id);
      if (!removed)
        return res
          .status(404)
          .json({ status: 'fail', message: 'User not found' });
      return res.status(204).json({ status: 'success', data: null });
    } else {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
      ).select('-password');
      if (!user)
        return res
          .status(404)
          .json({ status: 'fail', message: 'User not found' });
      return res.status(200).json({ status: 'success', data: { user } });
    }
  } catch (err) {
    console.error('deleteUser error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
