const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator'); // added validator

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'User must have an email'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      validate: [validator.isEmail, 'Please provide a valid email address'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true, // allow multiple docs without firebaseUid
      index: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false, 
    },
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password if it was modified (or is new)
userSchema.pre('save', async function (next) {
  // only run if password was set/modified
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    this.passwordChangedAt = Date.now();
    return next();
  } catch (err) {
    return next(err);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  if (!candidatePassword || !userPassword) return false;
  return bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password was changed after a given timestamp (in seconds)
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
