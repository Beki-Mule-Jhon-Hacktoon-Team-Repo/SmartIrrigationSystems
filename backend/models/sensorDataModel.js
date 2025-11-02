const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      required: [true, "Sensor data must include sensorId"],
      trim: true,
      index: true,
    },
    farmId: {
      type: String,
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    temperature: { type: Number },
    humidity: { type: Number },
    soil: { type: Number },
    pump: { type: Number, enum: [0, 1] },
    ph: { type: Number },
    npk: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true },
    meta: { type: Object, default: {} },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

sensorDataSchema.index({ sensorId: 1, timestamp: -1 });

sensorDataSchema.method("toJSON", function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

const SensorData = mongoose.model("SensorData", sensorDataSchema);

module.exports = SensorData;
