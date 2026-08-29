const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const nlp = require('compromise');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const os = require('os');
const uploadsDir = process.env.VERCEL
  ? path.join(os.tmpdir(), 'uploads')
  : path.join(__dirname, '../../uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {}

// ─── OCR ─────────────────────────────────────────────────
exports.ocr = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const lang = req.body.lang || 'eng';
    const isPdf = file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf';

    let text = '';
    let method = 'ocr';

    if (isPdf) {
      // For PDF files: first attempt digital text extraction
      try {
        const dataBuffer = file.buffer;
        const data = await pdfParse(dataBuffer);
        const extracted = (data.text || '').trim();

        if (extracted.length >= 30) {
          // Digital PDF — has selectable text, no OCR needed
          text = extracted;
          method = 'digital-extraction';
        } else {
          // Scanned or image-only PDF — attempt Tesseract on the file
          try {
            const result = await Tesseract.recognize(file.buffer, lang, {
              logger: () => {},
            });
            text = result.data.text || '';
            method = 'ocr';
          } catch (tessErr) {
            // Tesseract can't handle all PDF variants — return what we have
            text = extracted || '';
            method = 'digital-extraction';
          }
        }
      } catch (parseErr) {
        // pdf-parse failed, try Tesseract directly
        try {
          const result = await Tesseract.recognize(file.buffer, lang, {
            logger: () => {},
          });
          text = result.data.text || '';
          method = 'ocr';
        } catch (tessErr) {
          
          return res.status(500).json({ error: `OCR failed: ${tessErr.message}` });
        }
      }
    } else {
      // Standard image — use Tesseract directly
      const result = await Tesseract.recognize(file.buffer, lang, {
        logger: () => {},
      });
      text = result.data.text || '';
      method = 'ocr';
    }

    const outName = `${uuidv4()}-ocr.txt`;
    const mimeType = 'text/plain;charset=utf-8';
    let downloadUrl = `data:${mimeType};base64,${Buffer.from(text || '').toString('base64')}`;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = require('@vercel/blob');
        const blob = await put(`uploads/${outName}`, text, {
          access: 'public',
          contentType: 'text/plain; charset=utf-8'
        });
        downloadUrl = blob.url;
      } catch {}
    } else if (!process.env.VERCEL) {
      try {
        const outPath = path.join(uploadsDir, outName);
        fs.writeFileSync(outPath, text);
        downloadUrl = `/uploads/${outName}`;
      } catch {}
    }

    res.json({
      success: true,
      text,
      filename: outName,
      downloadUrl,
      charCount: text.length,
      method,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── SUMMARIZE ───────────────────────────────────────────
exports.summarize = async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const maxSentences = parseInt(req.body.maxSentences || '5');

    // Extract text from PDF
    const dataBuffer = file.buffer;
    const data = await pdfParse(dataBuffer);
    const rawText = data.text;

    if (!rawText || rawText.trim().length < 50) {
      fs.existsSync(file.path) && fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'PDF has no extractable text. Try OCR first.' });
    }

    // Extractive summarization using compromise
    const doc = nlp(rawText);
    const sentences = doc.sentences().out('array');

    // Score sentences by word frequency
    const wordFreq = {};
    const allWords = rawText.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    allWords.forEach((w) => {
      wordFreq[w] = (wordFreq[w] || 0) + 1;
    });

    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'been', 'will', 'they', 'them', 'their', 'what', 'which', 'when', 'where', 'than', 'then', 'also', 'more', 'some', 'there', 'were', 'into', 'such']);

    const scored = sentences.map((sentence, idx) => {
      const words = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      const score = words.reduce((sum, w) => {
        if (!stopWords.has(w)) sum += wordFreq[w] || 0;
        return sum;
      }, 0) / Math.max(words.length, 1);
      return { sentence, score, idx };
    });

    const topSentences = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.idx - b.idx)
      .map((s) => s.sentence);

    const summary = topSentences.join(' ');

    fs.existsSync(file.path) && fs.unlinkSync(file.path);
    res.json({
      success: true,
      summary,
      originalLength: rawText.length,
      summaryLength: summary.length,
      compressionRatio: ((1 - summary.length / rawText.length) * 100).toFixed(1) + '%',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
