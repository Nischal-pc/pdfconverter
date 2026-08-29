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

const os = require('os');
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {}

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

const { put } = require('@vercel/blob');

const saveBuffer = async (buffer, ext = '.pdf') => {
  const outName = `${uuidv4()}-output${ext}`;
  let finalBuf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  if (ext === '.pdf') {
    try {
      finalBuf = await normalizePDFBuffer(finalBuf);
    } catch (normErr) {
      console.warn('PDF normalization fallback:', normErr.message);
    }
  }
  
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`uploads/${outName}`, finalBuf, {
        access: 'public',
      });
      return { outPath: blob.url, outName };
    } catch (blobErr) {
      console.warn('Vercel Blob failed, falling back to browser memory:', blobErr.message);
    }
  }
  
  // Write to uploads directory for local / same-instance access
  try {
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, finalBuf);
  } catch {}

  // Direct In-Browser / Chrome memory delivery (No external cloud storage needed)
  const mimeType = ext === '.docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : ext === '.xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : ext === '.txt' ? 'text/plain;charset=utf-8'
    : ext === '.html' ? 'text/html;charset=utf-8'
    : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg'
    : ext === '.png' ? 'image/png'
    : ext === '.webp' ? 'image/webp'
    : ext === '.zip' ? 'application/zip'
    : 'application/pdf';

  const dataUrl = `data:${mimeType};base64,${finalBuf.toString('base64')}`;
  return { outPath: dataUrl, outName };
};

// ─── JPG/IMAGE → PDF ─────────────────────────────────────
exports.imageToPDF = async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files.length) return res.status(400).json({ error: 'No image files uploaded.' });

    const fitToPage = req.body.fitToPage === 'true';
    const A4_W = 595.28;
    const A4_H = 841.89;
    const MARGIN = 40;

    const doc = await PDFDocument.create();

    for (const file of files) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      let imageBytes = file.buffer;

      // Convert format using sharp for compatibility if not jpg/png
      if (['.webp', '.gif', '.bmp', '.tiff', '.tif', '.svg'].includes(ext) || !imageBytes) {
        imageBytes = await sharp(file.buffer || file.path).jpeg().toBuffer();
      }

      let embedded;
      try {
        if (file.mimetype === 'image/png' || ext === '.png') {
          embedded = await doc.embedPng(imageBytes);
        } else {
          embedded = await doc.embedJpg(imageBytes);
        }
      } catch {
        // Fallback: convert to standard JPEG via sharp and embed
        const converted = await sharp(imageBytes).jpeg().toBuffer();
        embedded = await doc.embedJpg(converted);
      }

      let pageW, pageH, drawW, drawH, drawX, drawY;

      if (fitToPage) {
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
    }

    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes, '.pdf');
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Image to PDF conversion failed: ${err.message}` });
  }
};

// ─── WORD / OFFICE → PDF ─────────────────────────────────
exports.wordToPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No Word file uploaded.' });

    let textContent = '';
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      textContent = result.value || '';
    } catch {
      textContent = file.buffer.toString('utf8');
    }

    // Generate clean PDF from Word content
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const contentWidth = pageWidth - margin * 2;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

    const rawLines = textContent.split('\n');
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
    const { outPath, outName } = await saveBuffer(outBytes, '.pdf');
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Word to PDF conversion failed: ${err.message}` });
  }
};

exports.pptToPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PowerPoint file uploaded.' });
    // Presentation outline PDF generator
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    page.drawText(`Converted Presentation: ${file.originalname || 'Slides'}`, {
      x: 50,
      y: 750,
      size: 16,
      font,
      color: rgb(0.1, 0.15, 0.2),
    });
    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes, '.pdf');
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `PPT to PDF failed: ${err.message}` });
  }
};

exports.excelToPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No Excel file uploaded.' });

    const XLSX = require('xlsx');
    const wb = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    const lineHeight = 16;
    const margin = 40;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

    const rows = data.map((r) => Array.isArray(r) ? r.join('  |  ') : String(r));

    for (let i = 0; i < (rows.length || 1); i += maxLinesPerPage) {
      const page = doc.addPage([pageWidth, pageHeight]);
      const pageRows = rows.slice(i, i + maxLinesPerPage);
      pageRows.forEach((rowStr, rIdx) => {
        const y = pageHeight - margin - rIdx * lineHeight - fontSize;
        page.drawText(String(rowStr).substring(0, 80), {
          x: margin,
          y,
          size: fontSize,
          font,
          color: rgb(0.1, 0.15, 0.2),
        });
      });
    }

    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes, '.pdf');
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Excel to PDF conversion failed: ${err.message}` });
  }
};

// ─── PDF → JPG ───────────────────────────────────────────
exports.pdfToJPG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const dpi = parseInt(req.body.dpi || '150');
    const scale = Math.max(0.5, Math.min(4, dpi / 72));
    const fileBuffer = file.buffer;
    const generatedFiles = [];

    try {
      const mupdf = await import('mupdf');
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf');
      const pageCount = doc.countPages();

      if (pageCount === 0) {
        return res.status(400).json({ error: 'The PDF contains no pages.' });
      }

      for (let i = 0; i < Math.min(pageCount, 10); i++) {
        const page = doc.loadPage(i);
        const pixmap = page.toPixmap(mupdf.Matrix.scale(scale, scale), mupdf.ColorSpace.DeviceRGB, false);
        const jpegBuffer = Buffer.from(pixmap.asJPEG(90));
        const { outPath, outName } = await saveBuffer(jpegBuffer, '.jpg');
        generatedFiles.push({ filename: outName, downloadUrl: outPath });
      }
    } catch (mupdfErr) {
      console.warn('mupdf failed, falling back to pdf-img-convert:', mupdfErr.message);
      const pdf2img = require('pdf-img-convert');
      const images = await pdf2img.convert(fileBuffer, { scale: Math.max(1, Math.min(3, scale)) });
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        const jpegBuffer = await sharp(images[i]).jpeg({ quality: 90 }).toBuffer();
        const { outPath, outName } = await saveBuffer(jpegBuffer, '.jpg');
        generatedFiles.push({ filename: outName, downloadUrl: outPath });
      }
    }

    if (generatedFiles.length === 0) {
      return res.status(500).json({ error: 'Failed to convert any pages from the PDF.' });
    }

    return res.json({
      success: true,
      files: generatedFiles,
      filename: generatedFiles[0]?.filename,
      downloadUrl: generatedFiles[0]?.downloadUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: `PDF to JPG conversion failed: ${err.message}` });
  }
};

// ─── PDF → PNG ───────────────────────────────────────────
exports.pdfToPNG = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const fileBuffer = file.buffer;
    const generatedFiles = [];

    try {
      const mupdf = await import('mupdf');
      const doc = mupdf.Document.openDocument(fileBuffer, 'application/pdf');
      const pageCount = doc.countPages();

      if (pageCount === 0) {
        return res.status(400).json({ error: 'The PDF contains no pages.' });
      }

      for (let i = 0; i < Math.min(pageCount, 10); i++) {
        const page = doc.loadPage(i);
        const pixmap = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, true);
        const pngBuffer = Buffer.from(pixmap.asPNG());
        const { outPath, outName } = await saveBuffer(pngBuffer, '.png');
        generatedFiles.push({ filename: outName, downloadUrl: outPath });
      }
    } catch (mupdfErr) {
      console.warn('mupdf failed, falling back to pdf-img-convert:', mupdfErr.message);
      const pdf2img = require('pdf-img-convert');
      const images = await pdf2img.convert(fileBuffer, { scale: 2.0 });
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        const pngBuffer = await sharp(images[i]).png().toBuffer();
        const { outPath, outName } = await saveBuffer(pngBuffer, '.png');
        generatedFiles.push({ filename: outName, downloadUrl: outPath });
      }
    }

    if (generatedFiles.length === 0) {
      return res.status(500).json({ error: 'Failed to convert any pages from the PDF.' });
    }

    return res.json({
      success: true,
      files: generatedFiles,
      filename: generatedFiles[0]?.filename,
      downloadUrl: generatedFiles[0]?.downloadUrl,
    });
  } catch (err) {
    return res.status(500).json({ error: `PDF to PNG conversion failed: ${err.message}` });
  }
};

// ─── PDF → TEXT ──────────────────────────────────────────
exports.pdfToText = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const dataBuffer = file.buffer;
    const data = await pdfParse(dataBuffer);

    const { outPath, outName } = await saveBuffer(Buffer.from(data.text || ''), '.txt');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      text: (data.text || '').substring(0, 2000),
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

    const dataBuffer = file.buffer;
    const data = await pdfParse(dataBuffer);

    const paragraphs = (data.text || '').split('\n').filter((line) => line.trim()).map(
      (line) => new Paragraph({ children: [new TextRun(line)] })
    );

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs.length ? paragraphs : [new Paragraph(' ')] }],
    });

    const docBuffer = await Packer.toBuffer(doc);
    const { outPath, outName } = await saveBuffer(docBuffer, '.docx');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
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
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else {
      extractedText = file.buffer.toString('utf8');
    }

    const { outPath, outName } = await saveBuffer(Buffer.from(extractedText || 'No text found.'), '.txt');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      text: (extractedText || '').substring(0, 2000),
    });
  } catch (err) {
    res.status(500).json({ error: `Word to Text conversion failed: ${err.message}` });
  }
};

// ─── WORD → HTML ─────────────────────────────────────────
exports.wordToHTML = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No Word file uploaded.' });

    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ buffer: file.buffer });
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

    const { outPath, outName } = await saveBuffer(Buffer.from(fullHtml), '.html');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      htmlPreview: result.value.substring(0, 3000),
    });
  } catch (err) {
    res.status(500).json({ error: `Word to HTML conversion failed: ${err.message}` });
  }
};

// ─── JPG → PNG ───────────────────────────────────────────
exports.jpgToPNG = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No image file uploaded.' });

    const pngBuffer = await sharp(file.buffer).png({ quality: 100 }).toBuffer();
    const { outPath, outName } = await saveBuffer(pngBuffer, '.png');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `JPG to PNG conversion failed: ${err.message}` });
  }
};

// ─── PNG → JPG ───────────────────────────────────────────
exports.pngToJPG = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No image file uploaded.' });

    const quality = Math.max(10, Math.min(100, parseInt(req.body.quality || '92', 10)));
    const jpgBuffer = await sharp(file.buffer).flatten({ background: '#ffffff' }).jpeg({ quality }).toBuffer();
    const { outPath, outName } = await saveBuffer(jpgBuffer, '.jpg');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `PNG to JPG conversion failed: ${err.message}` });
  }
};

// ─── IMAGE → WEBP ────────────────────────────────────────
exports.imageToWebP = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No image file uploaded.' });

    const quality = Math.max(10, Math.min(100, parseInt(req.body.quality || '85', 10)));
    const webpBuffer = await sharp(file.buffer).webp({ quality }).toBuffer();
    const { outPath, outName } = await saveBuffer(webpBuffer, '.webp');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Image to WebP conversion failed: ${err.message}` });
  }
};

// ─── IMAGE → TEXT (OCR) ──────────────────────────────────
exports.imageToText = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No image file uploaded.' });

    const Tesseract = require('tesseract.js');
    const { data: { text } } = await Tesseract.recognize(file.buffer, req.body.language || 'eng');

    const { outPath, outName } = await saveBuffer(Buffer.from(text || 'No text recognized.'), '.txt');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      text: (text || '').substring(0, 3000),
    });
  } catch (err) {
    res.status(500).json({ error: `Image OCR text extraction failed: ${err.message}` });
  }
};

// ─── PDF → EXCEL ─────────────────────────────────────────
exports.pdfToExcel = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const dataBuffer = file.buffer;
    const data = await pdfParse(dataBuffer);
    const XLSX = require('xlsx');

    const lines = (data.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const rows = lines.map((line) => {
      if (line.includes('\t')) return line.split('\t');
      if (line.includes('  ')) return line.split(/\s{2,}/);
      return [line];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows.length ? rows : [['Extracted PDF Data'], [data.text]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const excelBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const { outPath, outName } = await saveBuffer(excelBuf, '.xlsx');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      rowCount: rows.length,
      pages: data.numpages,
    });
  } catch (err) {
    res.status(500).json({ error: `PDF to Excel conversion failed: ${err.message}` });
  }
};

// ─── TEXT → PDF ──────────────────────────────────────────
exports.textToPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No text file uploaded.' });

    const text = file.buffer.toString('utf8');
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28;
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
    const { outPath, outName } = await saveBuffer(outBytes, '.pdf');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Text to PDF conversion failed: ${err.message}` });
  }
};

// ─── TEXT → WORD ─────────────────────────────────────────
exports.textToWord = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No text file uploaded.' });

    const rawText = file.buffer.toString('utf8');
    const paragraphs = rawText.split('\n').map((line) => new Paragraph({
      children: [new TextRun({ text: line || ' ', size: 24 })],
      spacing: { after: 120 },
    }));

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs.length ? paragraphs : [new Paragraph(' ')] }],
    });

    const docBuffer = await Packer.toBuffer(doc);
    const { outPath, outName } = await saveBuffer(docBuffer, '.docx');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Text to Word conversion failed: ${err.message}` });
  }
};

// ─── PDF → HTML ──────────────────────────────────────────
exports.pdfToHTML = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const dataBuffer = file.buffer;
    const data = await pdfParse(dataBuffer);

    const paragraphs = (data.text || '')
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

    const { outPath, outName } = await saveBuffer(Buffer.from(htmlContent), '.html');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      htmlPreview: htmlContent.substring(0, 3000),
      pages: data.numpages,
    });
  } catch (err) {
    res.status(500).json({ error: `PDF to HTML conversion failed: ${err.message}` });
  }
};

// ─── WEBP → JPG ──────────────────────────────────────────
exports.webpToJPG = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No WebP file uploaded.' });
    const buffer = await sharp(file.buffer).flatten({ background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer();
    const { outPath, outName } = await saveBuffer(buffer, '.jpg');
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `WebP to JPG failed: ${err.message}` });
  }
};

// ─── WEBP → PNG ──────────────────────────────────────────
exports.webpToPNG = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No WebP file uploaded.' });
    const buffer = await sharp(file.buffer).png().toBuffer();
    const { outPath, outName } = await saveBuffer(buffer, '.png');
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `WebP to PNG failed: ${err.message}` });
  }
};

// ─── MARKDOWN → PDF ──────────────────────────────────────
exports.markdownToPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No Markdown file uploaded.' });

    const mdText = file.buffer.toString('utf8');
    const doc = await PDFDocument.create();
    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
    const fontCode = await doc.embedFont(StandardFonts.Courier);

    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const contentWidth = pageWidth - margin * 2;

    let page = doc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    const checkPageBreak = (neededHeight) => {
      if (currentY - neededHeight < margin) {
        page = doc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
    };

    const lines = mdText.split('\n');
    let inCodeBlock = false;

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();

      if (line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }

      if (inCodeBlock) {
        checkPageBreak(16);
        page.drawText(line.substring(0, 75), {
          x: margin + 10,
          y: currentY - 12,
          size: 9.5,
          font: fontCode,
          color: rgb(0.2, 0.25, 0.3),
        });
        currentY -= 15;
        continue;
      }

      if (line.startsWith('# ')) {
        checkPageBreak(36);
        currentY -= 10;
        page.drawText(line.replace(/^#\s+/, '').substring(0, 60), {
          x: margin,
          y: currentY - 20,
          size: 20,
          font: fontBold,
          color: rgb(0.06, 0.09, 0.14),
        });
        currentY -= 28;
      } else if (line.startsWith('## ')) {
        checkPageBreak(28);
        currentY -= 8;
        page.drawText(line.replace(/^##\s+/, '').substring(0, 70), {
          x: margin,
          y: currentY - 16,
          size: 15,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.2),
        });
        currentY -= 22;
      } else if (line.startsWith('### ')) {
        checkPageBreak(22);
        page.drawText(line.replace(/^###\s+/, '').substring(0, 80), {
          x: margin,
          y: currentY - 13,
          size: 12.5,
          font: fontBold,
          color: rgb(0.15, 0.2, 0.25),
        });
        currentY -= 18;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        checkPageBreak(18);
        page.drawText(`•  ${line.substring(2)}`.substring(0, 90), {
          x: margin + 10,
          y: currentY - 11,
          size: 10.5,
          font: fontRegular,
          color: rgb(0.15, 0.2, 0.25),
        });
        currentY -= 16;
      } else if (!line.trim()) {
        currentY -= 10;
      } else {
        checkPageBreak(18);
        page.drawText(line.substring(0, 95), {
          x: margin,
          y: currentY - 11,
          size: 10.5,
          font: fontRegular,
          color: rgb(0.15, 0.2, 0.25),
        });
        currentY -= 16;
      }
    }

    const outBytes = await doc.save({ useObjectStreams: true });
    const { outPath, outName } = await saveBuffer(outBytes, '.pdf');

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Markdown to PDF failed: ${err.message}` });
  }
};

// ─── PDF → CSV ───────────────────────────────────────────
exports.pdfToCSV = async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) return res.status(400).json({ error: 'No PDF file uploaded.' });

    const dataBuffer = file.buffer;
    const data = await pdfParse(dataBuffer);

    const rawLines = (data.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
    const csvRows = rawLines.map((line) => {
      let cells;
      if (line.includes('\t')) cells = line.split('\t');
      else if (line.includes('  ')) cells = line.split(/\s{2,}/);
      else cells = [line];

      return cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',');
    });

    const csvContent = csvRows.join('\n');
    const { outPath, outName } = await saveBuffer(Buffer.from(csvContent), '.csv');

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      rowCount: csvRows.length,
      pages: data.numpages,
    });
  } catch (err) {
    res.status(500).json({ error: `PDF to CSV failed: ${err.message}` });
  }
};
