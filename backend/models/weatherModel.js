const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema(
  {
    farmId: {
      type: String,
      required: [true, 'Weather entry must belong to a farm'],
      index: true,
      trim: true,
    },
    // GeoJSON point: { type: "Point", coordinates: [lng, lat] }
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: function (v) {
            return !v || (Array.isArray(v) && v.length === 2);
          },
          message: 'location.coordinates must be [lng, lat]',
        },
      },
    },
    temperature: {
      type: Number, // Celsius
    },
    humidity: {
      type: Number,
      min: 0,
      max: 100,
    },
    windSpeed: {
      type: Number, // m/s
      min: 0,
    },
    windDirection: {
      type: Number, // degrees 0-360
      min: 0,
      max: 360,
    },
    precipitation: {
      type: Number, // mm
      min: 0,
    },
    pressure: {
      type: Number, // hPa
      min: 0,
    },
    source: {
      type: String, // e.g., "station", "api", "satellite"
      trim: true,
      default: 'station',
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for farm queries ordered by timestamp
weatherSchema.index({ farmId: 1, timestamp: -1 });
weatherSchema.index({ location: '2dsphere' });

// Remove internal fields from JSON output
weatherSchema.method('toJSON', function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

const Weather = mongoose.model('Weather', weatherSchema);

module.exports = Weather;