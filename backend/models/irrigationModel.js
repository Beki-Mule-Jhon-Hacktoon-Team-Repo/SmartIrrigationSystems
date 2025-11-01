const mongoose = require('mongoose');

const irrigationSchema = new mongoose.Schema(
  {
    irrigationId: {
      type: String,
      trim: true,
      index: true,
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
    status: {
      type: String,
      enum: ['scheduled', 'running', 'completed', 'failed', 'cancelled'],
      default: 'scheduled',
    },
    triggeredBy: {
      type: String,
      enum: ['manual', 'auto', 'schedule'],
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

// Compute duration if endTime set and duration missing
irrigationSchema.pre('save', function (next) {
  if (this.endTime && !this.durationSeconds && this.startTime) {
    const diff =
      (new Date(this.endTime).getTime() - new Date(this.startTime).getTime()) /
      1000;
    this.durationSeconds = diff > 0 ? Math.round(diff) : 0;
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