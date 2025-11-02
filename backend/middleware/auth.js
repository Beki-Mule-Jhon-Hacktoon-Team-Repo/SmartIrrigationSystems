
const admin = require('firebase-admin');

const verifyFirebaseToken = async (req, res, next) => {
  if (!admin.apps.length) {
    return res.status(500).json({ status: 'error', message: 'Firebase not initialized' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'fail', message: 'No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ status: 'fail', message: 'Invalid token', code: err.code });
  }
};

module.exports = { verifyFirebaseToken };