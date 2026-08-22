const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/history.controller');

router.get('/', protect, ctrl.getHistory);
router.post('/', protect, ctrl.addHistory);
router.delete('/:id', protect, ctrl.deleteHistory);
router.delete('/', protect, ctrl.clearHistory);

module.exports = router;
