const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const ctrl = require('../controllers/pdf.controller');

router.post('/merge', upload.array('files', 20), ctrl.mergePDF);
router.post('/split', upload.single('file'), ctrl.splitPDF);
router.post('/remove-pages', upload.single('file'), ctrl.removePages);
router.post('/extract-pages', upload.single('file'), ctrl.extractPages);
router.post('/organize', upload.single('file'), ctrl.organizePDF);
router.post('/compress', upload.single('file'), ctrl.compressPDF);
router.post('/repair', upload.single('file'), ctrl.repairPDF);
router.post('/rotate', upload.single('file'), ctrl.rotatePDF);
router.post('/watermark', upload.single('file'), ctrl.addWatermark);
router.post('/page-numbers', upload.single('file'), ctrl.addPageNumbers);
router.post('/protect', upload.single('file'), ctrl.protectPDF);
router.post('/unlock', upload.single('file'), ctrl.unlockPDF);
router.post('/add-text', upload.single('file'), ctrl.addTextToPDF);
router.post('/sign', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), ctrl.signPDF);
router.post('/visual-edit', upload.single('file'), ctrl.visualEditPDF);
router.post('/edit', upload.single('file'), ctrl.visualEditPDF);
router.post('/flatten', upload.single('file'), ctrl.flattenPDF);
router.post('/sanitize', upload.single('file'), ctrl.sanitizePDF);
router.post('/grayscale', upload.single('file'), ctrl.grayscalePDF);
router.post('/word-count', upload.single('file'), ctrl.wordCountPDF);
router.post('/page-count', upload.single('file'), ctrl.getPageCount);

module.exports = router;
