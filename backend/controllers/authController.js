// controllers/authController.js

const User = require('../models/userModel');
const admin = require('firebase-admin');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');


const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret';
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};


exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Email and password are required",
      });
    }

    let firebaseUid = null;

    // === Firebase User Creation (Optional) ===
    if (admin?.apps?.length > 0) {
      try {
        const fbUser = await admin.auth().createUser({
          email,
          password,
          displayName: name,
        });
        firebaseUid = fbUser.uid;
        console.log("Firebase user created:", firebaseUid);
      } catch (fbErr) {
        console.warn("Firebase error:", fbErr.code, fbErr.message);

        // Handle known Firebase errors
        if (fbErr.code === "auth/email-already-exists") {
          try {
            const existing = await admin.auth().getUserByEmail(email);
            firebaseUid = existing.uid;
            console.log("Reusing Firebase UID:", firebaseUid);
          } catch (getErr) {
            return res.status(400).json({
              status: "fail",
              message: "Email already in use (Firebase)",
            });
          }
        } else if (fbErr.code === "auth/invalid-password") {
          return res.status(400).json({
            status: "fail",
            message: "Password must be at least 6 characters",
          });
        } else if (fbErr.code?.includes("permission") || fbErr.status === 403) {
          return res.status(403).json({
            status: "fail",
            message: "Firebase Auth not properly configured (check console)",
            code: fbErr.code,
          });
        } else {
          return res.status(400).json({
            status: "fail",
            message: fbErr.message || "Firebase registration failed",
          });
        }
      }
    } else {
      console.log("Firebase Admin not initialized – skipping Firebase user");
    }

    // === Create Local MongoDB User ===
    const existingLocal = await User.findOne({ email });
    if (existingLocal) {
      return res.status(400).json({
        status: "fail",
        message: "User already exists in local database",
      });
    }

    const user = await User.create({
      name,
      email,
      password, // will be hashed by pre-save hook
      role: role || "user",
      firebaseUid,
    });

    user.password = undefined;
    const token = signToken(user);
    return res.status(201).json({
      status: "success",
      data: { user, firebaseUid },
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error during registration",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "fail", message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ status: "fail", message: "Incorrect email or password" });
    }

    const correct = await user.correctPassword(password, user.password);
    if (!correct) {
      return res
        .status(401)
        .json({ status: "fail", message: "Incorrect email or password" });
    }

    user.password = undefined;
    const token = signToken(user);
    return res
      .status(200)
      .json({ status: "success", data: { user }, token });
  } catch (err) {
    console.error("login error:", err && err.message);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ status: "fail", message: "User not found" });
    return res.status(200).json({ status: "success", data: { user } });
  } catch (err) {
    console.error("getUser error:", err && err.message);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

// POST /api/v1/auth/forgotPassword
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ status: 'fail', message: 'Email required' });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ status: 'fail', message: 'No user with that email' });

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/resetPassword/${resetToken}`;
    const message = `You requested a password reset. Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}\nIf you didn't request this, ignore this email.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Your password reset token (valid for 10 minutes)',
        message,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (emailErr) {
      // cleanup token fields on failure
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Error sending reset email:', emailErr && emailErr.message);
      return res
        .status(500)
        .json({
          status: 'error',
          message: 'Error sending email. Try again later.',
        });
    }
  } catch (err) {
    console.error('forgotPassword error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};

// PATCH /api/v1/auth/resetPassword/:token
exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user)
      return res
        .status(400)
        .json({ status: 'fail', message: 'Token is invalid or has expired' });

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    user.password = undefined;
    return res
      .status(200)
      .json({
        status: 'success',
        message: 'Password has been reset',
        data: { user },
      });
  } catch (err) {
    console.error('resetPassword error:', err && err.message);
    return res.status(500).json({ status: 'error', message: 'Server error' });
  }
};
