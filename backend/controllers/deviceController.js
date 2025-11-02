const Device = require('../models/deviceModel');

// Register page (QR landing) - returns JSON for Postman or simple HTML if query present
exports.registerDevicePage = async (req, res) => {
  try {
    const { device } = req.query;
    if (device) {
      // create or ensure device document exists (registered=false for now)
      try {
        const deviceDoc = await Device.findOneAndUpdate(
          { deviceId: device },
          {
            $setOnInsert: {
              deviceId: device,
              registered: false,
              status: 'pending',
              lastSeen: null,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();

        // Return simple HTML for browser + JSON details for Postman
        return res.send(`
          <h2>Register Device: ${device}</h2>
          <p>Device record ensured in DB.</p>
          <pre>${JSON.stringify(deviceDoc, null, 2)}</pre>
          <p>To activate this device (admin), POST to /api/v1/device/activate with JSON body {"deviceId":"${device}","activate":true}</p>
        `);
      } catch (dbErr) {
        console.error(
          'Error upserting device in registerDevicePage:',
          dbErr && dbErr.stack
        );
        return res
          .status(500)
          .json({ status: 'error', message: 'Failed to create device record' });
      }
    }

    // JSON for API clients / Postman when ?device not provided
    return res.status(200).json({
      status: 'success',
      message:
        'Device registration endpoint. Provide deviceId via device to complete registration.',
      instructions:
        'Arduino should call /api/v1/device/status/:deviceId to poll and POST /api/v1/device/activate from admin to activate.',
    });
  } catch (err) {
    console.error('registerDevicePage error:', err && err.stack);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// GET /api/v1/device/status/:deviceId
exports.getDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId)
      return res
        .status(400)
        .json({ status: 'fail', message: 'deviceId required' });

    const device = await Device.findOne({ deviceId }).lean();
    if (!device) {
      return res.status(404).json({
        status: 'fail',
        message: 'Device not found',
        device: null,
      });
    }

    return res.status(200).json({ status: 'success', device });
  } catch (err) {
    console.error('getDeviceStatus error:', err && err.stack);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// POST /api/v1/device/activate
exports.activateDevice = async (req, res) => {
  try {
    const { deviceId, activate = true, params = {}, farmId, zoneId } = req.body;

    if (!deviceId)
      return res
        .status(400)
        .json({ status: 'fail', message: 'deviceId required' });

    const update = {
      registered: true,
      status: activate ? 'active' : 'pending',
      active: !!activate,
      config: params || {},
      lastSeen: new Date(),
    };
    if (farmId) update.farmId = farmId;
    if (zoneId) update.zoneId = zoneId;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return res
      .status(200)
      .json({ status: 'success', message: 'Device activated/updated', device });
  } catch (err) {
    console.error('activateDevice error:', err && err.stack);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
