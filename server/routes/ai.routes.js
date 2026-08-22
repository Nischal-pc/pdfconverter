const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const ctrl = require('../controllers/ai.controller');

router.post('/ocr', upload.single('file'), ctrl.ocr);
router.post('/summarize', upload.single('file'), ctrl.summarize);

module.exports = router;
