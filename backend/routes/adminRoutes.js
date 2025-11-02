const express = require('express');
const controller = require('../controllers/adminController');

const router = express.Router();

// User management (protected)
router.post('/users', controller.adminAuth, controller.addUser);
router.get('/users', controller.adminAuth, controller.listUsers);
router.get('/users/regular', controller.adminAuth, controller.listRegularUsers);
router.get('/users/:id', controller.adminAuth, controller.getUser);
router.patch('/users/:id', controller.adminAuth, controller.updateUser);
router.delete('/users/:id', controller.adminAuth, controller.deleteUser);

module.exports = router;
