const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, index: true },
    action: { type: String, enum: ['start', 'stop'], required: true },
    triggeredBy: { type: String, enum: ['auto', 'manual', 'ai'], default: 'auto' },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IrrigationLog', logSchema);
