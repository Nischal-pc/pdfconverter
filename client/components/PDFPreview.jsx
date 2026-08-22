'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PDFPreview({ file }) {
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef(null);

  // Load PDF via PDF.js without any iframe or blob URL downloads
  useEffect(() => {
    let active = true;
    async function loadDoc() {
      if (!file) return;
      setLoading(true);
      try {
        const pdfjs = await import('pdfjs-dist');
        if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        const arrayBuf = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: arrayBuf }).promise;
        if (active) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        }
      } catch (err) {
        console.warn('PDFPreview render note:', err.message);
        if (active) setLoading(false);
      }
    }
    loadDoc();
    return () => {
      active = false;
    };
  }, [file]);

  // Render current page onto canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.warn('Canvas render error:', err);
    }
  }, [pdfDoc, currentPage]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  if (!file) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        marginTop: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <FileText size={16} color="var(--accent)" />
          <span>Document Preview ({file.name})</span>
        </div>

        {numPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage <= 1 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentPage} / {numPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= numPages}
              onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 8px',
                color: 'var(--text-primary)',
                cursor: currentPage >= numPages ? 'not-allowed' : 'pointer',
                opacity: currentPage >= numPages ? 0.5 : 1,
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 12,
          padding: 12,
          minHeight: 220,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Rendering document preview...
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: '100%',
              height: 'auto',
              maxHeight: 500,
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}
          />
        )}
      </div>
    </motion.div>
  );
}
