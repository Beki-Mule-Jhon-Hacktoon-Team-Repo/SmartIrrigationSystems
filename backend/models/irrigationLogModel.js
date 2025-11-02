const mongoose = require("mongoose");

const irrigationLogSchema = new mongoose.Schema({
  sensorId: {
    type: String,
    required: true,
  },
  waterAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["started", "stopped"],
    default: "started",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("IrrigationLog", irrigationLogSchema);
