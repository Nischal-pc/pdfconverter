const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { validateFileSignatures } = require('../middleware/security.middleware');
const ctrl = require('../controllers/pdf.controller');

router.post('/merge', upload.array('files', 20), validateFileSignatures, ctrl.mergePDF);
router.post('/split', upload.single('file'), validateFileSignatures, ctrl.splitPDF);
router.post('/remove-pages', upload.single('file'), validateFileSignatures, ctrl.removePages);
router.post('/extract-pages', upload.single('file'), validateFileSignatures, ctrl.extractPages);
router.post('/organize', upload.single('file'), validateFileSignatures, ctrl.organizePDF);
router.post('/compress', upload.single('file'), validateFileSignatures, ctrl.compressPDF);
router.post('/repair', upload.single('file'), validateFileSignatures, ctrl.repairPDF);
router.post('/rotate', upload.single('file'), validateFileSignatures, ctrl.rotatePDF);
router.post('/watermark', upload.single('file'), validateFileSignatures, ctrl.addWatermark);
router.post('/page-numbers', upload.single('file'), validateFileSignatures, ctrl.addPageNumbers);
router.post('/protect', upload.single('file'), validateFileSignatures, ctrl.protectPDF);
router.post('/unlock', upload.single('file'), validateFileSignatures, ctrl.unlockPDF);
router.post('/add-text', upload.single('file'), validateFileSignatures, ctrl.addTextToPDF);
router.post('/sign', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
]), validateFileSignatures, ctrl.signPDF);
router.post('/visual-edit', upload.single('file'), validateFileSignatures, ctrl.visualEditPDF);
router.post('/edit', upload.single('file'), validateFileSignatures, ctrl.visualEditPDF);
router.post('/flatten', upload.single('file'), validateFileSignatures, ctrl.flattenPDF);
router.post('/sanitize', upload.single('file'), validateFileSignatures, ctrl.sanitizePDF);
router.post('/grayscale', upload.single('file'), validateFileSignatures, ctrl.grayscalePDF);
router.post('/word-count', upload.single('file'), validateFileSignatures, ctrl.wordCountPDF);
router.post('/page-count', upload.single('file'), validateFileSignatures, ctrl.getPageCount);

module.exports = router;
