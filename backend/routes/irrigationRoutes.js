const express = require('express');
const controller = require('../controllers/irrigationController');

const router = express.Router();

router.post('/', controller.createIrrigation);
router.get('/', controller.getIrrigations);
router.get('/:id', controller.getIrrigation);
router.patch('/:id', controller.updateIrrigation);
router.delete('/:id', controller.deleteIrrigation);

module.exports = router;
