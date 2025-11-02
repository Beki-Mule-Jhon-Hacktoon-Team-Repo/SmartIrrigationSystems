const mongoose = require("mongoose");

const sensorDatasSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: [true, "deviceId is required"],
      trim: true,
      index: true,
    },
    temperature: {
      type: Number,
      required: [true, "temperature is required"],
    },
    humidity: {
      type: Number,
      required: [true, "humidity is required"],
      min: 0,
      max: 100,
    },
    soil: {
      type: Number,
      required: [true, "soil is required"],
      min: 0,
      max: 100,
    },
    ph: {
      type: Number,
      required: [true, "ph is required"],
    },
    npk: {
      type: Number,
      required: [true, "npk is required"],
    },
    pump: {
      type: Number,
      enum: [0, 1],
      required: false,
    },
    receivedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    meta: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for quick device/time queries
sensorDatasSchema.index({ deviceId: 1, receivedAt: -1 });

// Optional TTL support (set SENSOR_DATA_TTL_DAYS in .env to enable)
if (process.env.SENSOR_DATA_TTL_DAYS) {
  const days = Number(process.env.SENSOR_DATA_TTL_DAYS);
  if (!Number.isNaN(days) && days > 0) {
    sensorDatasSchema.index(
      { createdAt: 1 },
      { expireAfterSeconds: days * 24 * 60 * 60 }
    );
  }
}

// Clean up JSON output
sensorDatasSchema.method("toJSON", function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

// const SensorData = mongoose.model('SensorData', sensorDatasSchema);
// module.exports = SensorData;

{
  // Use existing compiled model if present to avoid OverwriteModelError (e.g. with nodemon hot reload)
  const SensorData =
    mongoose.models && mongoose.models.SensorData
      ? mongoose.models.SensorData
      : mongoose.model("SensorData", sensorDatasSchema);

  module.exports = SensorData;
}
