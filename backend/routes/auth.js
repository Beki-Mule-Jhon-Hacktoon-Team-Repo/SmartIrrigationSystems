const express = require('express');

const router = express.Router();

// Try loading controller, tolerate common typo
let authController = null;
try {
  authController = require('../controllers/authController');
} catch (err1) {
  try {
    authController = require('../controllers/authContoller'); // fallback to previously typo'd file
  } catch (err2) {
    console.error(
      'Failed to load auth controller (tried authController and authContoller):',
      err1.message,
      err2 && err2.message
    );
    authController = null;
  }
}

// helper that returns a function handler or a fallback function
const safeHandler = (ctrl, name) => {
  try {
    if (ctrl && typeof ctrl[name] === 'function') {
      return ctrl[name];
    }
  } catch (err) {
    // fall through to fallback
    console.error(
      `Error accessing handler ${name} on controller:`,
      err && err.message
    );
  }
  // fallback handler always a function (avoids "argument handler must be a function")
  return (req, res) => {
    console.error(`Auth handler missing or invalid: ${name}`);
    res.status(500).json({
      status: 'error',
      message: `Auth handler not available on server: ${name}`,
    });
  };
};

// POST /api/v1/auth/register
router.post('/register', safeHandler(authController, 'register'));

// POST /api/v1/auth/login
router.post('/login', safeHandler(authController, 'login'));

// POST /api/v1/auth/forgotPassword
router.post('/forgotPassword', safeHandler(authController, 'forgotPassword'));

// PATCH /api/v1/auth/resetPassword/:token
router.patch(
  '/resetPassword/:token',
  safeHandler(authController, 'resetPassword')
);

// GET /api/v1/auth/:id
router.get('/:id', safeHandler(authController, 'getUser'));

module.exports = router;
