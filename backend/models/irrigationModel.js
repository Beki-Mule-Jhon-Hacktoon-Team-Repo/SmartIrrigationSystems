const mongoose = require('mongoose');

const irrigationSchema = new mongoose.Schema(
  {
    irrigationId: {
      type: String,
      trim: true,
      index: true,
    },
    // new fields for device-level linking and telemetry
    deviceId: {
      type: String,
      trim: true,
      index: true,
    },
    valveId: {
      type: String,
      trim: true,
    },
    farmId: {
      type: String,
      required: [true, 'Irrigation entry must belong to a farm'],
      trim: true,
      index: true,
    },
    zoneId: {
      type: String,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    endTime: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      min: 0,
    },
    volumeLiters: {
      type: Number,
      min: 0,
    },
    // optional telemetry for the irrigation event
    flowRateLpm: {
      type: Number,
      min: 0, // liters per minute
    },
    pressureKpa: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['scheduled', 'running', 'completed', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    // include 'ai' as a possible trigger
    triggeredBy: {
      type: String,
      enum: ['manual', 'auto', 'schedule', 'ai'],
      default: 'manual',
    },
    action: {
      type: String,
      trim: true, // e.g., "open_valve", "close_valve"
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // external id and links to logs
    externalId: {
      type: String,
      trim: true,
      index: true,
    },
    logs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IrrigationLog',
      },
    ],
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

// Useful indexes
irrigationSchema.index({ farmId: 1, startTime: -1 });
irrigationSchema.index({ irrigationId: 1 });
irrigationSchema.index({ deviceId: 1, startTime: -1 });

// Compute duration if endTime set and duration missing
irrigationSchema.pre('save', function (next) {
  if (this.endTime && !this.durationSeconds && this.startTime) {
    const diff =
      (new Date(this.endTime).getTime() - new Date(this.startTime).getTime()) /
      1000;
    this.durationSeconds = diff > 0 ? Math.round(diff) : 0;
  }

  // If flowRate (L/min) and durationSeconds are available, compute volumeLiters
  if (
    !this.volumeLiters &&
    typeof this.flowRateLpm === 'number' &&
    typeof this.durationSeconds === 'number' &&
    this.durationSeconds > 0
  ) {
    // volume in liters = flowRate (L/min) * duration (min)
    this.volumeLiters = (this.flowRateLpm * this.durationSeconds) / 60;
  }
  next();
});

// Remove internal fields from JSON output
irrigationSchema.method('toJSON', function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

const Irrigation = mongoose.model('Irrigation', irrigationSchema);

module.exports = Irrigation;
