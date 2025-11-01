// controllers/authController.js
const User = require('../models/userModel');
const admin = require('firebase-admin');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email and password are required',
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
        console.log('Firebase user created:', firebaseUid);
      } catch (fbErr) {
        console.warn('Firebase error:', fbErr.code, fbErr.message);

        // Handle known Firebase errors
        if (fbErr.code === 'auth/email-already-exists') {
          try {
            const existing = await admin.auth().getUserByEmail(email);
            firebaseUid = existing.uid;
            console.log('Reusing Firebase UID:', firebaseUid);
          } catch (getErr) {
            return res.status(400).json({
              status: 'fail',
              message: 'Email already in use (Firebase)',
            });
          }
        } else if (fbErr.code === 'auth/invalid-password') {
          return res.status(400).json({
            status: 'fail',
            message: 'Password must be at least 6 characters',
          });
        } else if (fbErr.code?.includes('permission') || fbErr.status === 403) {
          return res.status(403).json({
            status: 'fail',
            message: 'Firebase Auth not properly configured (check console)',
            code: fbErr.code,
          });
        } else {
          return res.status(400).json({
            status: 'fail',
            message: fbErr.message || 'Firebase registration failed',
          });
        }
      }
    } else {
      console.log('Firebase Admin not initialized – skipping Firebase user');
    }

    // === Create Local MongoDB User ===
    const existingLocal = await User.findOne({ email });
    if (existingLocal) {
      return res.status(400).json({
        status: 'fail',
        message: 'User already exists in local database',
      });
    }

    const user = await User.create({
      name,
      email,
      password, // will be hashed by pre-save hook
      role: role || 'user',
      firebaseUid,
    });

    user.password = undefined;

    return res.status(201).json({
      status: 'success',
      data: { user, firebaseUid },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Server error during registration',
    });
  }
};