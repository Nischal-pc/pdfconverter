const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const sharp = require('sharp');
const pdfParse = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const { normalizePDFBuffer } = require('../utils/pdfNormalizer');

const uploadsDir = path.join(__dirname, '../../uploads');

const safeUnlink = (filePath) => {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    setTimeout(() => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {}
    }, 500);
  }
};

const saveBuffer = async (buffer, ext = '.pdf') => {
  const outName = `${uuidv4()}-output${ext}`;
  const outPath = path.join(uploadsDir, outName);
  let finalBuf = Buffer.from(buffer);
  if (ext === '.pdf') {
    try {
      finalBuf = await normalizePDFBuffer(finalBuf);
    } catch (normErr) {
      console.warn('PDF normalization fallback:', normErr.message);
    }
  }
  fs.writeFileSync(outPath, finalBuf);
  return { outPath, outName };
};

// ─── JPG/IMAGE → PDF ─────────────────────────────────────
exports.imageToPDF = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ error: 'No image files uploaded.' });

    const fitToPage = req.body.fitToPage === 'true';
    // A4 page dimensions in points (PDF units: 1pt = 1/72 inch)
    const A4_W = 595.28;
    const A4_H = 841.89;
    const MARGIN = 40;

    const doc = await PDFDocument.create();

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      let imageBytes;

      // Convert to PNG/JPEG using sharp for compatibility
      if (['.webp', '.gif', '.bmp', '.tiff', '.tif'].includes(ext)) {
        imageBytes = await sharp(file.path).jpeg().toBuffer();
      } else {
        imageBytes = fs.readFileSync(file.path);
      }

      const mimeType = file.mimetype === 'image/png' ? 'image/png' : 'image/jpeg';
      const embedded = mimeType === 'image/png'
        ? await doc.embedPng(imageBytes)
        : await doc.embedJpg(imageBytes);

      let pageW, pageH, drawW, drawH, drawX, drawY;

      if (fitToPage) {
        // Fit image within A4 with margin, maintaining aspect ratio
        const maxW = A4_W - MARGIN * 2;
        const maxH = A4_H - MARGIN * 2;
        const scale = Math.min(maxW / embedded.width, maxH / embedded.height, 1);
        drawW = embedded.width * scale;
        drawH = embedded.height * scale;
        pageW = A4_W;
        pageH = A4_H;
        drawX = (pageW - drawW) / 2;
        drawY = (pageH - drawH) / 2;
      } else {
        pageW = embedded.width;
        pageH = embedded.height;
        drawW = embedded.width;
        drawH = embedded.height;
        drawX = 0;
        drawY = 0;
      }

      const page = doc.addPage([pageW, pageH]);
      page.drawImage(embedded, { x: drawX, y: drawY, width: drawW, height: drawH });
      safeUnlink(file.path);
    }

    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── OFFICE → PDF (LibreOffice CLI) ─────────────────────
const officeToPDF = async (file, res) => {
  const loCmd = process.env.LIBREOFFICE_PATH || (process.platform === 'win32'
    ? '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"'
    : 'libreoffice');

  const outDir = uploadsDir;

  try {
    await execAsync(`${loCmd} --headless --convert-to pdf --outdir "${outDir}" "${file.path}"`);

    const baseName = path.basename(file.path, path.extname(file.path));
    const expectedOutput = path.join(outDir, `${baseName}.pdf`);

    if (!fs.existsSync(expectedOutput)) {
      throw new Error('LibreOffice conversion produced no output.');
    }

    const outName = `${uuidv4()}-converted.pdf`;
    const outPath = path.join(uploadsDir, outName);
    fs.renameSync(expectedOutput, outPath);
    safeUnlink(file.path);

    return res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(file.path);
    return res.status(500).json({
      error: `LibreOffice conversion failed: ${err.message}. Make sure LibreOffice is installed.`,
    });
  }
};

exports.wordToPDF = (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded.' });
  return officeToPDF(file, res);
};

exports.pptToPDF = (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded.' });
  return officeToPDF(file, res);
};

exports.excelToPDF = (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded.' });
  return officeToPDF(file, res);
};

// ─── PDF → JPG ───────────────────────────────────────────
exports.pdfToJPG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const dpi = parseInt(req.body.dpi || '150');
    const scale = Math.max(0.5, Math.min(4, dpi / 72)); // Scale factor relative to 72dpi

    const fileBuffer = fs.readFileSync(file.path);
    const mupdf = await import('mupdf');
    const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf');
    const pageCount = doc.countPages();

    if (pageCount === 0) {
      safeUnlink(file.path);
      return res.status(400).json({ error: 'The PDF contains no pages.' });
    }

    const generatedFiles = [];
    const baseId = uuidv4();

    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false);
      const jpegBuffer = Buffer.from(pixmap.asJPEG(90));
      const pageNumber = String(i + 1).padStart(3, '0');
      const outName = `${baseId}-page-${pageNumber}.jpg`;
      const outPath = path.join(uploadsDir, outName);
      fs.writeFileSync(outPath, jpegBuffer);
      generatedFiles.push({ filename: outName, downloadUrl: `/uploads/${outName}` });
    }

    safeUnlink(file.path);

    return res.json({
      success: true,
      files: generatedFiles,
      filename: generatedFiles[0]?.filename,
      downloadUrl: generatedFiles[0]?.downloadUrl,
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: `PDF to JPG conversion failed: ${err.message}` });
  }
};

// ─── PDF → TEXT ──────────────────────────────────────────
exports.pdfToText = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);

    const outName = `${uuidv4()}-output.txt`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, data.text);

    safeUnlink(file.path);
    res.json({
      success: true,
      filename: outName,
      downloadUrl: `/uploads/${outName}`,
      text: data.text.substring(0, 2000), // Preview
      pages: data.numpages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PDF → WORD ──────────────────────────────────────────
exports.pdfToWord = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);

    // Create a basic .docx from extracted text
    const paragraphs = data.text.split('\n').filter((line) => line.trim()).map(
      (line) => new Paragraph({ children: [new TextRun(line)] })
    );

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const docBuffer = await Packer.toBuffer(doc);
    const outName = `${uuidv4()}-output.docx`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, docBuffer);

    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── WORD → TEXT ─────────────────────────────────────────
exports.wordToText = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No Word file uploaded.' });

    let mammoth;
    try {
      mammoth = require('mammoth');
    } catch {
      mammoth = null;
    }

    let extractedText = '';
    if (mammoth) {
      const result = await mammoth.extractRawText({ path: file.path });
      extractedText = result.value;
    } else {
      extractedText = fs.readFileSync(file.path, 'utf8');
    }

    const outName = `${uuidv4()}-output.txt`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, extractedText || 'No text found in Word document.');

    safeUnlink(file.path);
    res.json({
      success: true,
      filename: outName,
      downloadUrl: `/uploads/${outName}`,
      text: (extractedText || '').substring(0, 2000),
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `Word to Text conversion failed: ${err.message}` });
  }
};

// ─── WORD → HTML ─────────────────────────────────────────
exports.wordToHTML = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No Word file uploaded.' });

    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ path: file.path });
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Converted Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #1e293b; background: #f8fafc; }
    h1, h2, h3 { color: #0f172a; }
    p { margin-bottom: 1em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  </style>
</head>
<body>
${result.value}
</body>
</html>`;

    const outName = `${uuidv4()}-output.html`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, fullHtml);

    safeUnlink(file.path);
    res.json({
      success: true,
      filename: outName,
      downloadUrl: `/uploads/${outName}`,
      htmlPreview: result.value.substring(0, 3000),
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `Word to HTML conversion failed: ${err.message}` });
  }
};

// ─── JPG → PNG ───────────────────────────────────────────
exports.jpgToPNG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image file uploaded.' });

    const pngBuffer = await sharp(file.path).png({ quality: 100 }).toBuffer();
    const outName = `${uuidv4()}-output.png`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, pngBuffer);

    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `JPG to PNG conversion failed: ${err.message}` });
  }
};

// ─── PNG → JPG ───────────────────────────────────────────
exports.pngToJPG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image file uploaded.' });

    const quality = Math.max(10, Math.min(100, parseInt(req.body.quality || '92', 10)));
    const jpgBuffer = await sharp(file.path).flatten({ background: '#ffffff' }).jpeg({ quality }).toBuffer();
    const outName = `${uuidv4()}-output.jpg`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, jpgBuffer);

    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `PNG to JPG conversion failed: ${err.message}` });
  }
};

// ─── IMAGE → WEBP ────────────────────────────────────────
exports.imageToWebP = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image file uploaded.' });

    const quality = Math.max(10, Math.min(100, parseInt(req.body.quality || '85', 10)));
    const webpBuffer = await sharp(file.path).webp({ quality }).toBuffer();
    const outName = `${uuidv4()}-output.webp`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, webpBuffer);

    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `Image to WebP conversion failed: ${err.message}` });
  }
};

// ─── IMAGE → TEXT (OCR) ──────────────────────────────────
exports.imageToText = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No image file uploaded.' });

    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(file.path, req.body.language || 'eng');

    const outName = `${uuidv4()}-ocr-output.txt`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, text || 'No text recognized in the image.');

    safeUnlink(file.path);
    res.json({
      success: true,
      filename: outName,
      downloadUrl: `/uploads/${outName}`,
      text: (text || '').substring(0, 3000),
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `Image OCR text extraction failed: ${err.message}` });
  }
};

// ─── PDF → EXCEL ─────────────────────────────────────────
exports.pdfToExcel = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);
    const XLSX = require('xlsx');

    // Parse lines into table rows
    const lines = data.text.split('\n').map((l) => l.trim()).filter(Boolean);
    const rows = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes('  ')) return line.split(/\s{2,}/);
      return [line];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['Extracted PDF Data'], [data.text]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const outName = `${uuidv4()}-output.xlsx`;
    const outPath = path.join(uploadsDir, outName);
    XLSX.writeFile(wb, outPath);

    safeUnlink(file.path);
    res.json({
      success: true,
      filename: outName,
      downloadUrl: `/uploads/${outName}`,
      rowCount: rows.length,
      pages: data.numpages,
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `PDF to Excel conversion failed: ${err.message}` });
  }
};

// ─── TEXT → PDF ──────────────────────────────────────────
exports.textToPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No text file uploaded.' });

    const text = fs.readFileSync(file.path, 'utf8');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const contentWidth = pageWidth - margin * 2;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

    const rawLines = text.split('\n');
    const wrappedLines = [];

    for (const raw of rawLines) {
      if (!raw.trim()) {
        wrappedLines.push('');
        continue;
      }
      const words = raw.split(' ');
      let cur = '';
      for (const w of words) {
        const testLine = cur ? `${cur} ${w}` : w;
        if (font.widthOfTextAtSize(testLine, fontSize) > contentWidth) {
          wrappedLines.push(cur);
          cur = w;
        } else {
          cur = testLine;
        }
      }
      if (cur) wrappedLines.push(cur);
    }

    if (wrappedLines.length === 0) {
      doc.addPage([pageWidth, pageHeight]);
    } else {
      for (let i = 0; i < wrappedLines.length; i += maxLinesPerPage) {
        const page = doc.addPage([pageWidth, pageHeight]);
        const pageLines = wrappedLines.slice(i, i + maxLinesPerPage);
        pageLines.forEach((line, lIdx) => {
          const y = pageHeight - margin - lIdx * lineHeight - fontSize;
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0.1, 0.15, 0.2),
          });
        });
      }
    }

    const outBytes = await doc.save();
    const { outName } = await saveBuffer(outBytes);

    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `Text to PDF conversion failed: ${err.message}` });
  }
};

// ─── TEXT → WORD ─────────────────────────────────────────
exports.textToWord = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No text file uploaded.' });

    const rawText = fs.readFileSync(file.path, 'utf8');
    const paragraphs = rawText.split('\n').map((line) => new Paragraph({
      children: [new TextRun({ text: line || ' ', size: 24 })],
      spacing: { after: 120 },
    }));

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const docBuffer = await Packer.toBuffer(doc);
    const outName = `${uuidv4()}-output.docx`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, docBuffer);

    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `Text to Word conversion failed: ${err.message}` });
  }
};

// ─── PDF → HTML ──────────────────────────────────────────
exports.pdfToHTML = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const dataBuffer = fs.readFileSync(file.path);
    const data = await pdfParse(dataBuffer);

    const paragraphs = data.text
      .split('\n\n')
      .map((p) => `<p>${p.trim().replace(/\n/g, '<br/>')}</p>`)
      .join('\n');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Converted PDF Document</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; max-width: 840px; margin: 40px auto; padding: 24px; color: #0f172a; background: #f8fafc; }
    p { margin-bottom: 1.2em; font-size: 15px; }
  </style>
</head>
<body>
  ${paragraphs}
</body>
</html>`;

    const outName = `${uuidv4()}-output.html`;
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, htmlContent);

    safeUnlink(file.path);
    res.json({
      success: true,
      filename: outName,
      downloadUrl: `/uploads/${outName}`,
      htmlPreview: htmlContent.substring(0, 3000),
      pages: data.numpages,
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `PDF to HTML conversion failed: ${err.message}` });
  }
};

// ─── PDF → PNG ───────────────────────────────────────────
exports.pdfToPNG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const fileBuffer = fs.readFileSync(file.path);
    const mupdf = await import('mupdf');
    const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf');
    const pageCount = doc.countPages();

    if (pageCount === 0) {
      safeUnlink(file.path);
      return res.status(400).json({ error: 'The PDF contains no pages.' });
    }

    const generatedFiles = [];
    const baseId = uuidv4();

    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      const pixmap = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, true);
      const pngBuffer = Buffer.from(pixmap.asPNG());
      const pageNumber = String(i + 1).padStart(3, '0');
      const outName = `${baseId}-page-${pageNumber}.png`;
      const outPath = path.join(uploadsDir, outName);
      fs.writeFileSync(outPath, pngBuffer);
      generatedFiles.push({ filename: outName, downloadUrl: `/uploads/${outName}` });
    }

    safeUnlink(file.path);
    return res.json({
      success: true,
      files: generatedFiles,
      filename: generatedFiles[0]?.filename,
      downloadUrl: generatedFiles[0]?.downloadUrl,
    });
  } catch (err) {
    safeUnlink(req.file?.path);
    return res.status(500).json({ error: `PDF to PNG conversion failed: ${err.message}` });
  }
};

// ─── WEBP → JPG ──────────────────────────────────────────
exports.webpToJPG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No WebP file uploaded.' });
    const buffer = await sharp(file.path).flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer();
    const outName = `${uuidv4()}-output.jpg`;
    fs.writeFileSync(path.join(uploadsDir, outName), buffer);
    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `WebP to JPG failed: ${err.message}` });
  }
};

// ─── WEBP → PNG ──────────────────────────────────────────
exports.webpToPNG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No WebP file uploaded.' });
    const buffer = await sharp(file.path).png().toBuffer();
    const outName = `${uuidv4()}-output.png`;
    fs.writeFileSync(path.join(uploadsDir, outName), buffer);
    safeUnlink(file.path);
    res.json({ success: true, filename: outName, downloadUrl: `/uploads/${outName}` });
  } catch (err) {
    safeUnlink(req.file?.path);
    res.status(500).json({ error: `WebP to PNG failed: ${err.message}` });
  }
};
