const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema(
  {
    // Link to a User who owns this device/reading (optional)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: false,
    },

    sensorId: {
      type: String,
      required: [true, "Sensor must have an id"],
      trim: true,
      index: true,
    },
    farmId: {
      type: String,
      required: [true, "Sensor reading must belong to a farm"],
      trim: true,
      index: true,
    },
    soilMoisture: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    // allow a plain 'soil' numeric value commonly used by sensors
    soil: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    temperature: {
      type: Number,
      required: false,
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    // pump state: 0 or 1 or boolean
    pump: {
      type: Number,
      enum: [0, 1],
      required: false,
    },
    ph: {
      type: Number,
      required: false,
    },
    npk: {
      type: Number,
      required: false,
    },
    battery: {
      type: Number,
      min: 0,
      max: 100,
      required: false,
    },
    // GeoJSON point: { type: "Point", coordinates: [lng, lat] }
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        validate: {
          validator: function (v) {
            return !v || (Array.isArray(v) && v.length === 2);
          },
          message: "location.coordinates must be [lng, lat]",
        },
      },
    },
    timestamp: {
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
    timestamps: true, // adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for queries by farm ordered by recent timestamp
sensorSchema.index({ farmId: 1, timestamp: -1 });

// 2dsphere index for geo queries if location.coordinates provided
sensorSchema.index({ location: "2dsphere" });

// Optional TTL (retain sensor docs for N days) - enable by setting SENSOR_TTL_DAYS in .env
if (process.env.SENSOR_TTL_DAYS) {
  const days = Number(process.env.SENSOR_TTL_DAYS);
  if (!Number.isNaN(days) && days > 0) {
    // expire after days -> convert to seconds
    sensorSchema.index(
      { createdAt: 1 },
      { expireAfterSeconds: days * 24 * 60 * 60 }
    );
  }
}

// Remove internal fields from JSON output
sensorSchema.method("toJSON", function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

const Sensor = mongoose.model("Sensor", sensorSchema);

module.exports = Sensor;
