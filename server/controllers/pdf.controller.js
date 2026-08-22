const { PDFDocument, rgb, StandardFonts, degrees } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { execFile, exec } = require('child_process');
const { promisify } = require('util');
const { resolvePageScope, parsePageSpec } = require('../utils/pdfPages');
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

const sendFile = (res, filePath, downloadName) => {
  res.download(filePath, downloadName, (err) => {
    if (err && !res.headersSent) {
      res.status(500).json({ error: 'Failed to send file.' });
    }
  });
};

const { put } = require('@vercel/blob');

const saveBuffer = async (buffer, ext = '.pdf') => {
  const outName = `${uuidv4()}-output${ext}`;
  let finalBuf = Buffer.from(buffer);
  if (ext === '.pdf') {
    try {
      finalBuf = await normalizePDFBuffer(finalBuf);
    } catch (normErr) {
      console.warn('PDF normalization fallback:', normErr.message);
    }
  }
  
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${outName}`, finalBuf, {
      access: 'public',
    });
    return { outPath: blob.url, outName };
  } else {
    // Local fallback when running offline/without Vercel Blob token
    const outPath = path.join(uploadsDir, outName);
    fs.writeFileSync(outPath, finalBuf);
    return { outPath: `/uploads/${outName}`, outName };
  }
};

// ─── MERGE ───────────────────────────────────────────────
exports.mergePDF = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 2) {
      return res.status(400).json({ error: 'Please upload at least 2 PDF files.' });
    }

    const merged = await PDFDocument.create();

    // Optional metadata
    const title = (req.body.title || '').trim();
    const author = (req.body.author || '').trim();
    if (title) merged.setTitle(title);
    if (author) merged.setAuthor(author);
    merged.setCreator('PdfFlow');
    merged.setProducer('PdfFlow — pdf-lib');

    for (const file of files) {
      const bytes = file.buffer;
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }

    const mergedBytes = await merged.save();
    const { outPath, outName } = await saveBuffer(mergedBytes);

    // Cleanup input files
    files.forEach((f) => fs.existsSync(f.path) && fs.unlinkSync(f.path));

    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── SPLIT ───────────────────────────────────────────────
exports.splitPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const { ranges } = req.body; // e.g. "1-3,4-6" or empty for split every page
    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    let pageRanges = [];

    if (ranges) {
      pageRanges = ranges.split(',').map((r) => {
        const parts = r.trim().split('-').map(Number);
        return parts.length === 2
          ? { start: parts[0] - 1, end: parts[1] - 1 }
          : { start: parts[0] - 1, end: parts[0] - 1 };
      });
    } else {
      // Split every page
      for (let i = 0; i < totalPages; i++) {
        pageRanges.push({ start: i, end: i });
      }
    }

    const outputFiles = [];
    for (let i = 0; i < pageRanges.length; i++) {
      const { start, end } = pageRanges[i];
      const newDoc = await PDFDocument.create();
      const indices = [];
      for (let p = start; p <= end && p < totalPages; p++) indices.push(p);
      const copied = await newDoc.copyPages(doc, indices);
      copied.forEach((p) => newDoc.addPage(p));
      const outBytes = await newDoc.save();
      const { outPath, outName } = await saveBuffer(outBytes, `.pdf`);
      outputFiles.push({ filename: outName, downloadUrl: outPath, pages: `${start + 1}-${end + 1}` });
    }

    
    res.json({ success: true, files: outputFiles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── REMOVE PAGES ────────────────────────────────────────
exports.removePages = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const { pages } = req.body; // e.g. "1,3,5-7" — supports ranges
    if (!pages) return res.status(400).json({ error: 'No pages specified to remove.' });

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    // Use parsePageSpec for range support (1,3,5-7)
    const pagesToRemove = new Set(parsePageSpec(pages, totalPages));

    const keepIndices = [];
    for (let i = 0; i < totalPages; i++) {
      if (!pagesToRemove.has(i)) keepIndices.push(i);
    }

    if (keepIndices.length === 0) {
      
      return res.status(400).json({ error: 'Cannot remove all pages from a PDF.' });
    }

    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(doc, keepIndices);
    copied.forEach((p) => newDoc.addPage(p));

    const outBytes = await newDoc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      pagesRemoved: pagesToRemove.size,
      pagesRemaining: keepIndices.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── EXTRACT PAGES ───────────────────────────────────────
exports.extractPages = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const { pages } = req.body; // e.g. "1,3,5-7"
    if (!pages) return res.status(400).json({ error: 'No pages specified.' });

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    const pagesToExtract = new Set();
    pages.split(',').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [s, e] = trimmed.split('-').map(Number);
        for (let i = s; i <= e; i++) pagesToExtract.add(i - 1);
      } else {
        pagesToExtract.add(parseInt(trimmed) - 1);
      }
    });

    const indices = [...pagesToExtract].filter((i) => i >= 0 && i < totalPages).sort((a, b) => a - b);
    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(doc, indices);
    copied.forEach((p) => newDoc.addPage(p));

    const outBytes = await newDoc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ORGANIZE (REORDER PAGES) ────────────────────────────
exports.organizePDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const { order } = req.body; // e.g. "3,1,2" — new page order
    if (!order) return res.status(400).json({ error: 'No page order specified.' });

    const newOrder = order.split(',').map((p) => parseInt(p.trim()) - 1);
    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);

    const newDoc = await PDFDocument.create();
    const copied = await newDoc.copyPages(doc, newOrder);
    copied.forEach((p) => newDoc.addPage(p));

    const outBytes = await newDoc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── COMPRESS ────────────────────────────────────────────
exports.compressPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const quality = req.body.quality || 'screen'; // screen, ebook, printer, prepress
    const outName = `${uuidv4()}-compressed.pdf`;
    const outPath = path.join(uploadsDir, outName);

    // Try Ghostscript
    const gsCmd = process.env.GHOSTSCRIPT_PATH || (process.platform === 'win32' ? 'gswin64c' : 'gs');
    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=/${quality}`,
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-sOutputFile=${outPath}`,
      file.path,
    ];

    try {
      await execAsync(`"${gsCmd}" ${gsArgs.map((a) => `"${a}"`).join(' ')}`);
    } catch (gsErr) {
      // Ghostscript not available — fallback: re-save with pdf-lib (minimal compression)
      console.warn('Ghostscript unavailable, using pdf-lib fallback:', gsErr.message);
      const bytes = file.buffer;
      const doc = await PDFDocument.load(bytes);
      const outBytes = await doc.save({ useObjectStreams: true });
      fs.writeFileSync(outPath, outBytes);
    }

    const originalSize = fs.statSync(file.path).size;
    const compressedSize = fs.statSync(outPath).size;
    const reduction = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);

    
    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      originalSize,
      compressedSize,
      reduction: `${reduction}%`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── REPAIR ──────────────────────────────────────────────
exports.repairPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Could not repair PDF: ${err.message}` });
  }
};

// ─── ROTATE ──────────────────────────────────────────────
exports.rotatePDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const rotation = parseInt(req.body.rotation || '90', 10);
    const pages = req.body.pages;
    const pageScope = req.body.pageScope || 'all';

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const totalPages = doc.getPageCount();

    const pageIndices = pages
      ? parsePageSpec(pages, totalPages)
      : resolvePageScope(pageScope, req.body.page, totalPages);

    pageIndices.forEach((i) => {
      if (i >= 0 && i < totalPages) {
        const page = doc.getPage(i);
        page.setRotation(degrees((page.getRotation().angle + rotation) % 360));
      }
    });

    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── WATERMARK ───────────────────────────────────────────
exports.addWatermark = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const text = req.body.text || 'CONFIDENTIAL';
    const opacity = parseFloat(req.body.opacity || '0.3');
    const fontSize = parseInt(req.body.fontSize || '60', 10);
    const angle = parseInt(req.body.angle || '45', 10);
    const tileMode = req.body.tileMode === 'true';
    const pageScope = req.body.pageScope || 'all';

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const total = doc.getPageCount();
    const indices = resolvePageScope(pageScope, req.body.page, total);

    indices.forEach((i) => {
      const page = doc.getPage(i);
      const { width, height } = page.getSize();
      const textW = font.widthOfTextAtSize(text, fontSize);

      if (tileMode) {
        for (let y = 0; y < height; y += fontSize * 2.2) {
          for (let x = -width; x < width * 2; x += textW + 80) {
            page.drawText(text, {
              x: x + (y % 2) * 40,
              y,
              size: fontSize,
              font,
              color: rgb(0.55, 0.55, 0.55),
              opacity,
              rotate: degrees(angle),
            });
          }
        }
      } else {
        page.drawText(text, {
          x: width / 2 - textW / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5),
          opacity,
          rotate: degrees(angle),
        });
      }
    });

    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── ADD PAGE NUMBERS ────────────────────────────────────
exports.addPageNumbers = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const position = req.body.position || 'bottom-center';
    const startFrom = parseInt(req.body.startFrom || '1', 10);
    const fontSize = parseInt(req.body.fontSize || '12', 10);
    const format = req.body.format || 'number'; // number | pageOf | custom
    const prefix = req.body.prefix || '';
    const suffix = req.body.suffix || '';

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;

    pages.forEach((page, i) => {
      const { width, height } = page.getSize();
      const num = startFrom + i;
      let text = String(num);
      if (format === 'pageOf') text = `Page ${num} of ${startFrom + total - 1}`;
      if (format === 'custom') text = `${prefix}${num}${suffix}`;
      const textWidth = font.widthOfTextAtSize(text, fontSize);

      let x, y;
      switch (position) {
        case 'bottom-left':  x = 30;  y = 20; break;
        case 'bottom-right': x = width - textWidth - 30; y = 20; break;
        default:             x = (width - textWidth) / 2; y = 20;
      }

      page.drawText(text, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
    });

    const outBytes = await doc.save();
    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PROTECT ─────────────────────────────────────────────
exports.protectPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const { userPassword, ownerPassword } = req.body;
    if (!userPassword) return res.status(400).json({ error: 'User password is required.' });

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);

    const outBytes = await doc.save({
      userPassword,
      ownerPassword: ownerPassword || userPassword,
      permissions: {
        printing: 'lowResolution',
        modifying: false,
        copying: false,
        annotating: false,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      },
    });

    const { outPath, outName } = await saveBuffer(outBytes);

    
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const hexToRgb = (hex) => {
  const h = (hex || '#000000').replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.padEnd(6, '0').slice(0, 6), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

const getAnchorPosition = (position, pageW, pageH, boxW, boxH) => {
  const m = 48;
  switch (position) {
    case 'top-left': return { x: m, y: pageH - m - boxH };
    case 'top-center': return { x: (pageW - boxW) / 2, y: pageH - m - boxH };
    case 'top-right': return { x: pageW - boxW - m, y: pageH - m - boxH };
    case 'center': return { x: (pageW - boxW) / 2, y: (pageH - boxH) / 2 };
    case 'bottom-left': return { x: m, y: m };
    case 'bottom-center': return { x: (pageW - boxW) / 2, y: m };
    default: return { x: pageW - boxW - m, y: m }; // bottom-right
  }
};

const resolvePageIndices = (pageSpec, total) => parsePageSpec(pageSpec, total);

const applyOffsets = (x, y, offsetX, offsetY) => ({
  x: x + parseFloat(offsetX || 0),
  y: y + parseFloat(offsetY || 0),
});

// ─── ADD TEXT ────────────────────────────────────────────
exports.addTextToPDF = async (req, res) => {
  if (req.body.annotations) {
    return exports.visualEditPDF(req, res);
  }
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const text = (req.body.text || '').replace(/\\n/g, '\n');
    if (!text.trim()) return res.status(400).json({ error: 'Text is required.' });

    const x = parseFloat(req.body.x || '72');
    const y = parseFloat(req.body.y || '72');
    const lineHeight = parseFloat(req.body.lineHeight || '1.35');
    const fontSize = parseInt(req.body.fontSize || '14', 10);
    const color = hexToRgb(req.body.color || '#000000');
    const opacity = Math.min(1, Math.max(0.1, parseFloat(req.body.opacity || '1')));
    const fontKey = req.body.font || 'helvetica';
    const alignment = req.body.alignment || 'left';

    const fontMap = {
      helvetica: StandardFonts.Helvetica,
      helveticaBold: StandardFonts.HelveticaBold,
      times: StandardFonts.TimesRoman,
      courier: StandardFonts.Courier,
      italic: StandardFonts.TimesRomanItalic,
    };

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const font = await doc.embedFont(fontMap[fontKey] || StandardFonts.Helvetica);
    const total = doc.getPageCount();
    const indices = resolvePageScope(req.body.pageScope || 'all', req.body.page, total);
    const lines = text.split('\n');

    indices.forEach((i) => {
      const page = doc.getPage(i);
      const { width } = page.getSize();
      lines.forEach((line, lineIdx) => {
        const lineY = y + lineIdx * fontSize * lineHeight;
        let lineX = x;
        const lineW = font.widthOfTextAtSize(line, fontSize);
        if (alignment === 'center') lineX = (width - lineW) / 2;
        if (alignment === 'right') lineX = width - lineW - x;
        page.drawText(line, { x: lineX, y: lineY, size: fontSize, font, color, opacity });
      });
    });

    const outBytes = await doc.save();
    const { outName } = await saveBuffer(outBytes);
    
    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      pagesModified: indices.length,
      totalPages: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── SIGN PDF (every page by default) ────────────────────
exports.signPDF = async (req, res) => {
  if (req.body.annotations) {
    return exports.visualEditPDF(req, res);
  }
  try {
    const file = req.files?.file?.[0] || req.file;
    if (!file) return res.status(400).json({ error: 'No PDF uploaded.' });

    const signType = req.body.signType || 'text';
    const position = req.body.position || 'bottom-right';
    const pageScope = req.body.pageScope || 'all';
    const offsetX = req.body.offsetX || '0';
    const offsetY = req.body.offsetY || '0';
    const includeDate = req.body.includeDate !== 'false';
    const includeReason = req.body.includeReason === 'true';
    const reason = req.body.reason || '';
    const dateLabel = req.body.dateLabel || new Date().toLocaleDateString();

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const total = doc.getPageCount();
    const indices = resolvePageScope(pageScope, req.body.page, total);

    if (indices.length === 0) {
      return res.status(400).json({ error: 'No valid pages selected for signing.' });
    }

    const stampExtras = (page, baseX, baseY) => {
      const small = 10;
      let yOff = -14;
      if (includeReason && reason.trim()) {
        page.drawText(reason.trim().slice(0, 80), {
          x: baseX,
          y: baseY + yOff,
          size: small,
          color: rgb(0.35, 0.35, 0.45),
        });
        yOff -= 12;
      }
      if (includeDate) {
        page.drawText(dateLabel, {
          x: baseX,
          y: baseY + yOff,
          size: small,
          color: rgb(0.4, 0.4, 0.5),
        });
      }
    };

    if (signType === 'image') {
      const sigFile = req.files?.signature?.[0];
      if (!sigFile) return res.status(400).json({ error: 'Upload a signature image (PNG/JPG).' });

      const imgBytes = fs.readFileSync(sigFile.path);
      let image;
      try {
        image = sigFile.mimetype === 'image/png'
          ? await doc.embedPng(imgBytes)
          : await doc.embedJpg(imgBytes);
      } catch {
        image = await doc.embedPng(imgBytes);
      }

      const scale = Math.min(1, Math.max(0.05, parseFloat(req.body.signScale || '0.25')));
      const imgOpacity = Math.min(1, Math.max(0.1, parseFloat(req.body.signOpacity || '1')));
      const imgW = image.width * scale;
      const imgH = image.height * scale;

      indices.forEach((i) => {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        let { x, y } = getAnchorPosition(position, width, height, imgW, imgH);
        ({ x, y } = applyOffsets(x, y, offsetX, offsetY));
        page.drawImage(image, { x, y, width: imgW, height: imgH, opacity: imgOpacity });
        stampExtras(page, x, y);
      });

      
    } else {
      const signatureText = req.body.signatureText || 'Signed';
      const fontSize = parseInt(req.body.fontSize || '28', 10);
      const signColor = hexToRgb(req.body.signColor || '#1a1a66');
      const font = await doc.embedFont(StandardFonts.TimesRomanItalic);
      const titleSize = 11;
      const titleText = req.body.signerTitle || '';

      indices.forEach((i) => {
        const page = doc.getPage(i);
        const { width, height } = page.getSize();
        const textW = font.widthOfTextAtSize(signatureText, fontSize);
        const blockH = fontSize + (titleText ? titleSize + 6 : 0);
        let { x, y } = getAnchorPosition(position, width, height, textW, blockH);
        ({ x, y } = applyOffsets(x, y, offsetX, offsetY));

        if (titleText) {
          page.drawText(titleText, {
            x,
            y: y + fontSize + 4,
            size: titleSize,
            color: rgb(0.35, 0.35, 0.45),
          });
        }

        page.drawText(signatureText, {
          x, y, size: fontSize, font, color: signColor,
        });
        page.drawLine({
          start: { x, y: y - 4 },
          end: { x: x + textW, y: y - 4 },
          thickness: 1.5,
          color: signColor,
          opacity: 0.6,
        });
        stampExtras(page, x, y - 18);
      });
    }

    const outBytes = await doc.save({ useObjectStreams: false });
    const { outName } = await saveBuffer(outBytes);
    
    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      pagesSigned: indices.length,
      totalPages: total,
      signedAllPages: indices.length === total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── VISUAL EDIT & SIGN PDF (Freeform type & sign anywhere) ─────
exports.visualEditPDF = async (req, res) => {
  try {
    const file = req.file || req.files?.file?.[0];
    if (!file) return res.status(400).json({ error: 'No PDF file uploaded.' });

    let annotations = [];
    if (req.body.annotations) {
      try {
        annotations = typeof req.body.annotations === 'string'
          ? JSON.parse(req.body.annotations)
          : req.body.annotations;
      } catch {
        annotations = [];
      }
    }

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();

    const fontMap = {
      helvetica: StandardFonts.Helvetica,
      helveticaBold: StandardFonts.HelveticaBold,
      times: StandardFonts.TimesRoman,
      courier: StandardFonts.Courier,
      italic: StandardFonts.TimesRomanItalic,
    };

    const embeddedFonts = {};
    const getFont = async (fontName) => {
      const key = fontMap[fontName] || StandardFonts.Helvetica;
      if (!embeddedFonts[key]) {
        embeddedFonts[key] = await doc.embedFont(key);
      }
      return embeddedFonts[key];
    };

    const modifiedPages = new Set();

    for (const ann of annotations) {
      const pageIndex = Math.max(0, Math.min(totalPages - 1, parseInt(ann.page || 0, 10)));
      const page = doc.getPage(pageIndex);
      const { width: pageWidth, height: pageHeight } = page.getSize();
      modifiedPages.add(pageIndex);

      const xPercent = parseFloat(ann.xPercent ?? ((ann.x || 0) / pageWidth * 100));
      const yPercent = parseFloat(ann.yPercent ?? ((ann.y || 0) / pageHeight * 100));
      const widthPercent = parseFloat(ann.widthPercent ?? 20);
      const heightPercent = parseFloat(ann.heightPercent ?? 8);

      const targetX = (xPercent / 100) * pageWidth;
      const targetW = (widthPercent / 100) * pageWidth;
      const targetH = (heightPercent / 100) * pageHeight;
      // In PDF coordinate system, Y=0 is at the bottom
      const targetY = pageHeight - ((yPercent / 100) * pageHeight) - targetH;

      if (ann.dataUrl && (ann.type === 'signature' || ann.type === 'image' || ann.type === 'stamp' || ann.type === 'checkmark' || ann.dataUrl.startsWith('data:image'))) {
        try {
          const base64Data = ann.dataUrl.replace(/^data:image\/\w+;base64,/, '');
          const imgBuffer = Buffer.from(base64Data, 'base64');
          let embeddedImage;
          try {
            embeddedImage = await doc.embedPng(imgBuffer);
          } catch {
            embeddedImage = await doc.embedJpg(imgBuffer);
          }
          const opacity = Math.min(1, Math.max(0.1, parseFloat(ann.opacity || '1')));
          page.drawImage(embeddedImage, {
            x: Math.max(0, targetX),
            y: Math.max(0, targetY),
            width: Math.max(10, targetW),
            height: Math.max(10, targetH),
            opacity,
          });
        } catch (imgErr) {
          console.warn('Failed to embed annotation image:', imgErr.message);
        }
      } else if (ann.text) {
        const font = await getFont(ann.font || 'helvetica');
        const color = hexToRgb(ann.color || '#000000');
        const fontSizeRatio = parseFloat(ann.fontSizeRatio || '0.025');
        const calculatedFontSize = Math.max(8, Math.min(72, fontSizeRatio ? fontSizeRatio * pageHeight : parseFloat(ann.fontSize || 14)));
        const textLines = String(ann.text).split('\n');
        const lineHeight = calculatedFontSize * (parseFloat(ann.lineHeight || 1.25));

        textLines.forEach((line, lineIdx) => {
          const lineY = targetY + targetH - ((lineIdx + 1) * calculatedFontSize);
          page.drawText(line, {
            x: Math.max(0, targetX),
            y: Math.max(0, lineY),
            size: calculatedFontSize,
            font,
            color,
            opacity: Math.min(1, Math.max(0.1, parseFloat(ann.opacity || '1'))),
          });
        });
      }
    }

    const outBytes = await doc.save({ useObjectStreams: false });
    const { outName } = await saveBuffer(outBytes);
    

    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      pagesModified: modifiedPages.size || 1,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── HIGHLIGHT ───────────────────────────────────────────
exports.highlightPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const x = parseFloat(req.body.x || '72');
    const y = parseFloat(req.body.y || '600');
    const width = parseFloat(req.body.width || '200');
    const height = parseFloat(req.body.height || '24');
    const color = hexToRgb(req.body.color || '#ffff00');
    const opacity = parseFloat(req.body.opacity || '0.35');
    const borderRadius = parseFloat(req.body.borderRadius || '0');

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes);
    const total = doc.getPageCount();
    const indices = resolvePageScope(req.body.pageScope || 'all', req.body.page, total);

    indices.forEach((i) => {
      const page = doc.getPage(i);
      page.drawRectangle({
        x, y, width, height,
        color,
        opacity,
        borderWidth: borderRadius > 0 ? 1 : 0,
        borderColor: color,
      });
    });

    const outBytes = await doc.save();
    const { outName } = await saveBuffer(outBytes);
    
    res.json({
      success: true,
      filename: outName,
      downloadUrl: outPath,
      pagesModified: indices.length,
      totalPages: total,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PAGE COUNT ──────────────────────────────────────────
exports.getPageCount = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });
    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const count = doc.getPageCount();
    
    res.json({ success: true, pageCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── UNLOCK ──────────────────────────────────────────────
exports.unlockPDF = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const { password } = req.body;

    const bytes = file.buffer;
    const doc = await PDFDocument.load(bytes, {
      password: password || '',
      ignoreEncryption: !password,
    });

    const outBytes = await doc.save();
    const { outPath, outName } = saveBuffer(outBytes);

    fs.existsSync(file.path) && fs.unlinkSync(file.path);
    res.json({ success: true, filename: outName, downloadUrl: outPath });
  } catch (err) {
    res.status(500).json({ error: `Could not unlock PDF. Wrong password? ${err.message}` });
  }
};
