const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Farm must have a name'],
      trim: true,
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      index: true,
    },
    // size in acres
    size: {
      type: Number,
      required: false,
      min: 0,
    },
    // total liters saved by this farm
    litresSaved: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Inactive'],
      default: 'Active',
    },
    description: {
      type: String,
      trim: true,
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

// text index for convenience
farmSchema.index({ name: 'text', location: 'text', description: 'text' });

// Automatically populate owner on find queries
farmSchema.pre(/^find/, function (next) {
  // 'this' is the query
  this.populate({
    path: 'owner',
    select: 'name email', // only bring basic fields
  });
  next();
});

// Virtual to expose owner's name directly as farmerName
farmSchema.virtual('farmerName').get(function () {
  // owner may be populated (object) or just an ObjectId
  if (this.owner && typeof this.owner === 'object') {
    return this.owner.name || null;
  }
  return null;
});

farmSchema.method('toJSON', function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
});

module.exports = mongoose.model('Farm', farmSchema);
