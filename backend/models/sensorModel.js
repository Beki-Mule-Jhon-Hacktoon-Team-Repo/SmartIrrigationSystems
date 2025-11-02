const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema(
  {
    sensorId: {
      type: String,
      // required: [true, 'Sensor must have an id'],
      trim: true,
      index: true,
    },
    // new: deviceId to match incoming device messages
    deviceId: {
      type: String,
      trim: true,
      index: true,
    },
    farmId: {
      type: String,
      required: [true, 'Sensor reading must belong to a farm'],
      trim: true,
      index: true,
    },
    soilMoisture: {
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
    // new fields from SensorData
    pH: {
      type: Number,
      required: false,
    },
    npk: {
      type: Number,
      required: false,
    },
    pumpStatus: {
      type: Boolean,
      default: false,
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
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        validate: {
          validator: function (v) {
            return !v || (Array.isArray(v) && v.length === 2);
          },
          message: 'location.coordinates must be [lng, lat]',
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

// index for deviceId lookups
sensorSchema.index({ deviceId: 1 });

// 2dsphere index for geo queries if location.coordinates provided
sensorSchema.index({ location: '2dsphere' });

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
sensorSchema.method('toJSON', function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

sensorSchema.pre('save', function (next) {
  if (this.soilMoisture < 30) {
    console.log('Alert: Low moisture for farm ' + this.farmId);
    // Send email/SMS or push notification
  }
  next();
});

const Sensor = mongoose.model('Sensor', sensorSchema);

module.exports = Sensor;
