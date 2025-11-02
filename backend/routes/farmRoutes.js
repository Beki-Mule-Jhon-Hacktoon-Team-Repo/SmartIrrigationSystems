const express = require('express');
const controller = require('../controllers/farmController');

const router = express.Router();

// Public: list and create
router.get('/', controller.listFarms);
router.post('/', controller.createFarm);

// Single farm CRUD
router.get('/:id', controller.getFarm);
router.patch('/:id', controller.updateFarm);
router.delete('/:id', controller.deleteFarm);

module.exports = router;
