'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool,
  Type,
  Calendar,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
  Move,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadAndProcess } from '@/lib/api';
import { getApiBase } from '@/lib/apiBase';
import { triggerFileDownload } from '@/lib/download';
import { useAuth } from '@/context/AuthContext';

export default function VisualPDFEditor({ file, onCancel, onDone }) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.1);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageRendering, setPageRendering] = useState(false);
  const [activeTool, setActiveTool] = useState('select'); // 'select' | 'text' | 'sign' | 'date' | 'check'

  // Annotations stored by page index (0-indexed): array of items
  const [annotations, setAnnotations] = useState([]);
  const annotationsRef = useRef([]);
  annotationsRef.current = annotations;

  const [selectedId, setSelectedId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDraggingAny, setIsDraggingAny] = useState(false);

  // Signature Modal state
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [sigTab, setSigTab] = useState('draw'); // 'draw' | 'type' | 'upload'
  const [typedName, setTypedName] = useState('Jane Smith');
  const [selectedFont, setSelectedFont] = useState('cursive-1');
  const [sigColor, setSigColor] = useState('#1e3a8a');
  const [sigStrokeWidth, setSigStrokeWidth] = useState(2.5);

  const canvasRef = useRef(null);
  const drawPadRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingSig = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragInfoRef = useRef(null);

  // Load PDF.js Document
  useEffect(() => {
    let active = true;
    async function loadDoc() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        const data = await file.arrayBuffer();
        const doc = await pdfjs.getDocument({ data }).promise;
        if (active) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error('Failed to load PDF in editor:', err);
        toast.error('Failed to render PDF preview.');
      }
    }
    loadDoc();
    return () => { active = false; };
  }, [file]);

  // Render current page onto canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;
    setPageRendering(true);
    try {
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch (err) {
      console.warn('Page render error:', err);
    } finally {
      setPageRendering(false);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  // Handle clicking on document canvas to place text or stamp
  const handleCanvasClick = (e) => {
    if (dragInfoRef.current?.hasMoved) {
      // Don't place or deselect if this was a drag gesture
      return;
    }

    if (activeTool === 'select') {
      setSelectedId(null);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    if (activeTool === 'text') {
      const newText = {
        id: `text-${Date.now()}`,
        type: 'text',
        page: currentPage - 1,
        xPercent: Math.max(2, Math.min(75, xPercent)),
        yPercent: Math.max(2, Math.min(90, yPercent)),
        widthPercent: 26,
        heightPercent: 6,
        text: 'Type text here...',
        fontSize: 16,
        color: '#0f172a',
        font: 'helvetica',
      };
      setAnnotations((prev) => [...prev, newText]);
      setSelectedId(newText.id);
      setActiveTool('select');
      toast.success('Text added! Drag the handle to move anywhere.');
    } else if (activeTool === 'date') {
      const today = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
      const newDate = {
        id: `date-${Date.now()}`,
        type: 'text',
        page: currentPage - 1,
        xPercent: Math.max(2, Math.min(75, xPercent)),
        yPercent: Math.max(2, Math.min(90, yPercent)),
        widthPercent: 20,
        heightPercent: 5,
        text: today,
        fontSize: 14,
        color: '#1e3a8a',
        font: 'helvetica',
      };
      setAnnotations((prev) => [...prev, newDate]);
      setSelectedId(newDate.id);
      setActiveTool('select');
      toast.success('Date stamp placed! Drag anywhere to position.');
    } else if (activeTool === 'check') {
      const checkCanvas = document.createElement('canvas');
      checkCanvas.width = 64;
      checkCanvas.height = 64;
      const cCtx = checkCanvas.getContext('2d');
      cCtx.strokeStyle = '#10b981';
      cCtx.lineWidth = 6;
      cCtx.lineCap = 'round';
      cCtx.lineJoin = 'round';
      cCtx.beginPath();
      cCtx.moveTo(14, 34);
      cCtx.lineTo(26, 48);
      cCtx.lineTo(50, 16);
      cCtx.stroke();

      const newCheck = {
        id: `check-${Date.now()}`,
        type: 'checkmark',
        page: currentPage - 1,
        xPercent: Math.max(2, Math.min(90, xPercent)),
        yPercent: Math.max(2, Math.min(90, yPercent)),
        widthPercent: 6,
        heightPercent: 6,
        dataUrl: checkCanvas.toDataURL('image/png'),
      };
      setAnnotations((prev) => [...prev, newCheck]);
      setSelectedId(newCheck.id);
      setActiveTool('select');
      toast.success('Checkmark placed! Drag anywhere on the page.');
    }
  };

  // Dragging & Resizing annotations across canvas
  const handleDragStart = (e, id, mode = 'move') => {
    // If clicking on text input or select control, don't initiate drag unless from drag handle
    const targetTag = e.target.tagName;
    if ((targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') && !e.target.closest('.annotation-drag-handle')) {
      setSelectedId(id);
      return;
    }

    e.stopPropagation();
    setSelectedId(id);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const currentItem = annotationsRef.current.find((item) => item.id === id);
    if (!currentItem) return;

    dragInfoRef.current = {
      id,
      mode,
      startClientX: clientX,
      startClientY: clientY,
      startXPercent: currentItem.xPercent,
      startYPercent: currentItem.yPercent,
      startWidthPercent: currentItem.widthPercent,
      startHeightPercent: currentItem.heightPercent,
      canvasRect,
      hasMoved: false,
    };

    setIsDraggingAny(true);

    const onPointerMove = (moveEvent) => {
      if (!dragInfoRef.current) return;
      const info = dragInfoRef.current;

      const currentClientX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentClientY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentClientX - info.startClientX;
      const deltaY = currentClientY - info.startClientY;

      if (!info.hasMoved && (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2)) {
        info.hasMoved = true;
      }

      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }

      const deltaXPercent = (deltaX / info.canvasRect.width) * 100;
      const deltaYPercent = (deltaY / info.canvasRect.height) * 100;

      if (info.mode === 'move') {
        const newX = Math.max(0, Math.min(100 - info.startWidthPercent, info.startXPercent + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - info.startHeightPercent, info.startYPercent + deltaYPercent));
        setAnnotations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, xPercent: newX, yPercent: newY } : item))
        );
      } else if (info.mode === 'resize') {
        const newWidth = Math.max(4, Math.min(100 - info.startXPercent, info.startWidthPercent + deltaXPercent));
        const newHeight = Math.max(3, Math.min(100 - info.startYPercent, info.startHeightPercent + deltaYPercent));
        setAnnotations((prev) =>
          prev.map((item) => (item.id === id ? { ...item, widthPercent: newWidth, heightPercent: newHeight } : item))
        );
      }
    };

    const onPointerUp = () => {
      setIsDraggingAny(false);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      // Reset drag hasMoved after short microtask so click doesn't deselect
      setTimeout(() => {
        if (dragInfoRef.current) {
          dragInfoRef.current.hasMoved = false;
        }
      }, 50);
    };

    window.addEventListener('mousemove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  };

  const updateAnnotation = (id, updates) => {
    setAnnotations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const duplicateAnnotation = (id) => {
    const item = annotations.find((a) => a.id === id);
    if (!item) return;
    const duplicated = {
      ...item,
      id: `${item.type}-${Date.now()}`,
      xPercent: Math.min(80, item.xPercent + 3),
      yPercent: Math.min(85, item.yPercent + 3),
    };
    setAnnotations((prev) => [...prev, duplicated]);
    setSelectedId(duplicated.id);
    toast.success('Element duplicated!');
  };

  const deleteAnnotation = (id) => {
    setAnnotations((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Keyboard shortcut listener for selected annotations
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedId) return;
      const targetTag = e.target.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteAnnotation(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 2 : 0.5;
        setAnnotations((prev) =>
          prev.map((item) => {
            if (item.id !== selectedId) return item;
            let nx = item.xPercent;
            let ny = item.yPercent;
            if (e.key === 'ArrowLeft') nx = Math.max(0, nx - step);
            if (e.key === 'ArrowRight') nx = Math.min(100 - item.widthPercent, nx + step);
            if (e.key === 'ArrowUp') ny = Math.max(0, ny - step);
            if (e.key === 'ArrowDown') ny = Math.min(100 - item.heightPercent, ny + step);
            return { ...item, xPercent: nx, yPercent: ny };
          })
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  // Signature Pad Drawing Logic
  const startDrawing = (e) => {
    const canvas = drawPadRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX - rect.left, y: clientY - rect.top };
    isDrawingSig.current = true;
  };

  const drawSignature = (e) => {
    if (!isDrawingSig.current || !drawPadRef.current) return;
    const canvas = drawPadRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const newPos = { x: clientX - rect.left, y: clientY - rect.top };

    ctx.strokeStyle = sigColor;
    ctx.lineWidth = sigStrokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(newPos.x, newPos.y);
    ctx.stroke();

    lastPos.current = newPos;
  };

  const stopDrawing = () => {
    isDrawingSig.current = false;
  };

  const clearSignaturePad = () => {
    if (!drawPadRef.current) return;
    const canvas = drawPadRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Place Signature onto current PDF page
  const applySignature = () => {
    let sigDataUrl = '';

    if (sigTab === 'draw') {
      if (!drawPadRef.current) return;
      sigDataUrl = drawPadRef.current.toDataURL('image/png');
    } else if (sigTab === 'type') {
      const typeCanvas = document.createElement('canvas');
      typeCanvas.width = 400;
      typeCanvas.height = 120;
      const tCtx = typeCanvas.getContext('2d');
      tCtx.fillStyle = sigColor;
      
      let fontSpec = '36px "Dancing Script", cursive';
      if (selectedFont === 'cursive-2') fontSpec = 'italic 34px "Times New Roman", serif';
      if (selectedFont === 'cursive-3') fontSpec = '36px "Caveat", cursive';
      if (selectedFont === 'cursive-4') fontSpec = 'bold italic 32px "Georgia", serif';

      tCtx.font = fontSpec;
      tCtx.textBaseline = 'middle';
      tCtx.fillText(typedName || 'Signature', 20, 60);

      // Underline flourish
      tCtx.strokeStyle = sigColor;
      tCtx.lineWidth = 2;
      tCtx.beginPath();
      tCtx.moveTo(20, 85);
      tCtx.lineTo(280, 85);
      tCtx.stroke();

      sigDataUrl = typeCanvas.toDataURL('image/png');
    }

    if (!sigDataUrl) {
      toast.error('Please create or select a signature first.');
      return;
    }

    const newSig = {
      id: `sig-${Date.now()}`,
      type: 'signature',
      page: currentPage - 1,
      xPercent: 35,
      yPercent: 45,
      widthPercent: 25,
      heightPercent: 10,
      dataUrl: sigDataUrl,
    };

    setAnnotations((prev) => [...prev, newSig]);
    setSelectedId(newSig.id);
    setIsSignModalOpen(false);
    toast.success('Signature added! Drag it anywhere on the document.');
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        const newSig = {
          id: `sig-${Date.now()}`,
          type: 'signature',
          page: currentPage - 1,
          xPercent: 35,
          yPercent: 45,
          widthPercent: 25,
          heightPercent: 10,
          dataUrl,
        };
        setAnnotations((prev) => [...prev, newSig]);
        setSelectedId(newSig.id);
        setIsSignModalOpen(false);
        toast.success('Signature uploaded and placed! Drag to move anywhere.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit and export PDF with burned annotations
  const handleSaveAndExport = async () => {
    if (annotations.length === 0) {
      toast.error('Please add at least one text box or signature before exporting.');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Applying signatures and text to PDF...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('annotations', JSON.stringify(annotations));

      const data = await uploadAndProcess('/api/pdf/visual-edit', formData);

      toast.dismiss(toastId);
      toast.success('PDF successfully signed & downloaded!');

      const outputFilename = file?.name
        ? `${file.name.replace(/\.[^/.]+$/, '')}-signed.pdf`
        : (data.filename || 'Signed-Document.pdf');

      // Forcibly download the file to the user's local machine
      if (data?.downloadUrl) {
        await triggerFileDownload(data.downloadUrl, outputFilename);
      }

      if (onDone) {
        onDone({ ...data, filename: outputFilename });
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.error || err.message || 'Failed to save PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const currentAnnotations = annotations.filter(
    (item) => item.page === currentPage - 1
  );

  return (
    <div className="visual-editor-container">
      {/* Top Floating Action Toolbar */}
      <div className="visual-editor-topbar">
        <div className="topbar-group">
          <button
            type="button"
            className={`editor-tool-btn ${activeTool === 'select' ? 'active' : ''}`}
            onClick={() => setActiveTool('select')}
            title="Select & Move Items"
          >
            <Move size={16} />
            <span>Move Tool</span>
          </button>

          <button
            type="button"
            className="editor-tool-btn primary"
            onClick={() => {
              setIsSignModalOpen(true);
            }}
          >
            <PenTool size={16} />
            <span>+ Add Signature</span>
          </button>

          <button
            type="button"
            className={`editor-tool-btn ${activeTool === 'text' ? 'active' : ''}`}
            onClick={() => {
              setActiveTool('text');
              toast('Click anywhere on the PDF to place a text box');
            }}
          >
            <Type size={16} />
            <span>+ Type Text</span>
          </button>

          <button
            type="button"
            className={`editor-tool-btn ${activeTool === 'date' ? 'active' : ''}`}
            onClick={() => {
              setActiveTool('date');
              toast('Click on the page to place a date stamp');
            }}
          >
            <Calendar size={16} />
            <span>+ Date</span>
          </button>

          <button
            type="button"
            className={`editor-tool-btn ${activeTool === 'check' ? 'active' : ''}`}
            onClick={() => {
              setActiveTool('check');
              toast('Click on the page to place a checkmark');
            }}
          >
            <Check size={16} />
            <span>+ Checkmark</span>
          </button>
        </div>

        {/* Page Nav & Zoom */}
        <div className="topbar-group page-controls">
          <button
            type="button"
            className="editor-icon-btn"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            title="Previous Page"
          >
            <ChevronLeft size={18} />
          </button>

          <span className="page-indicator">
            Page {currentPage} / {numPages}
          </span>

          <button
            type="button"
            className="editor-icon-btn"
            disabled={currentPage >= numPages}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            title="Next Page"
          >
            <ChevronRight size={18} />
          </button>

          <div className="divider-v" />

          <button
            type="button"
            className="editor-icon-btn"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.15))}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <span className="zoom-indicator">{Math.round(scale * 100)}%</span>

          <button
            type="button"
            className="editor-icon-btn"
            onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Finish & Export */}
        <div className="topbar-group">
          {annotations.length > 0 && (
            <button
              type="button"
              className="editor-tool-btn danger"
              onClick={() => {
                if (confirm('Remove all annotations on all pages?')) {
                  setAnnotations([]);
                  setSelectedId(null);
                }
              }}
              title="Clear All"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            className="btn-primary editor-export-btn"
            disabled={isProcessing || annotations.length === 0}
            onClick={handleSaveAndExport}
          >
            <Download size={16} />
            <span>{isProcessing ? 'Saving...' : 'Apply & Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive PDF Stage */}
      <div className="visual-editor-stage" ref={containerRef}>
        <div
          className="canvas-container"
          onClick={handleCanvasClick}
          style={{ position: 'relative', display: 'inline-block', margin: '0 auto' }}
        >
          <canvas ref={canvasRef} className="pdf-page-canvas" />

          {pageRendering && (
            <div className="canvas-loading-overlay">
              <span>Rendering page {currentPage}...</span>
            </div>
          )}

          {/* Interactive Draggable Annotation Overlays for Current Page */}
          {currentAnnotations.map((ann) => {
            const isSelected = selectedId === ann.id;

            return (
              <div
                key={ann.id}
                className={`annotation-item ${isSelected ? 'selected' : ''} ${isDraggingAny && isSelected ? 'is-dragging' : ''}`}
                style={{
                  position: 'absolute',
                  left: `${ann.xPercent}%`,
                  top: `${ann.yPercent}%`,
                  width: `${ann.widthPercent}%`,
                  minHeight: `${ann.heightPercent}%`,
                  userSelect: 'none',
                  touchAction: 'none',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(ann.id);
                }}
                onMouseDown={(e) => handleDragStart(e, ann.id, 'move')}
                onTouchStart={(e) => handleDragStart(e, ann.id, 'move')}
              >
                {/* Drag Handle Top Bar for Text Boxes */}
                {ann.type === 'text' && (
                  <div
                    className="annotation-drag-handle"
                    title="Click and drag to move anywhere on the page"
                    onMouseDown={(e) => handleDragStart(e, ann.id, 'move')}
                    onTouchStart={(e) => handleDragStart(e, ann.id, 'move')}
                  >
                    <Move size={12} className="handle-icon" />
                    <span className="handle-label">Drag to move</span>
                  </div>
                )}

                {/* Text Item */}
                {ann.type === 'text' && (
                  <div className="annotation-text-box">
                    <input
                      type="text"
                      value={ann.text}
                      onChange={(e) => updateAnnotation(ann.id, { text: e.target.value })}
                      onFocus={() => setSelectedId(ann.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(ann.id);
                      }}
                      placeholder="Type text here..."
                      style={{
                        width: '100%',
                        fontSize: `${ann.fontSize || 16}px`,
                        color: ann.color || '#0f172a',
                        fontFamily: ann.font === 'times' ? 'serif' : ann.font === 'courier' ? 'monospace' : 'sans-serif',
                        fontWeight: ann.bold ? 'bold' : 'normal',
                        fontStyle: ann.italic ? 'italic' : 'normal',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        cursor: 'text',
                        padding: '2px 4px',
                      }}
                    />
                  </div>
                )}

                {/* Signature / Image Item */}
                {(ann.type === 'signature' || ann.type === 'checkmark') && ann.dataUrl && (
                  <div className="annotation-image-box">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ann.dataUrl}
                      alt="Signature"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Resize Handle in bottom-right corner */}
                {isSelected && (
                  <div
                    className="annotation-resize-handle"
                    title="Drag to resize width & height"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, ann.id, 'resize');
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, ann.id, 'resize');
                    }}
                  />
                )}

                {/* Selected Quick Floating Toolbar */}
                {isSelected && (
                  <div
                    className="annotation-floating-bar"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                  >
                    {ann.type === 'text' && (
                      <>
                        {/* Font size picker */}
                        <select
                          value={ann.fontSize || 16}
                          onChange={(e) =>
                            updateAnnotation(ann.id, { fontSize: parseInt(e.target.value, 10) })
                          }
                          className="floating-select"
                          title="Font size"
                        >
                          <option value={12}>12px</option>
                          <option value={14}>14px</option>
                          <option value={16}>16px</option>
                          <option value={20}>20px</option>
                          <option value={24}>24px</option>
                          <option value={32}>32px</option>
                        </select>

                        {/* Font Family */}
                        <select
                          value={ann.font || 'helvetica'}
                          onChange={(e) => updateAnnotation(ann.id, { font: e.target.value })}
                          className="floating-select"
                          title="Font style"
                        >
                          <option value="helvetica">Sans</option>
                          <option value="times">Serif</option>
                          <option value="courier">Mono</option>
                        </select>

                        {/* Bold toggle */}
                        <button
                          type="button"
                          className={`floating-btn ${ann.bold ? 'active' : ''}`}
                          style={{ fontWeight: 'bold' }}
                          onClick={() => updateAnnotation(ann.id, { bold: !ann.bold })}
                          title="Toggle Bold"
                        >
                          B
                        </button>

                        {/* Italic toggle */}
                        <button
                          type="button"
                          className={`floating-btn ${ann.italic ? 'active' : ''}`}
                          style={{ fontStyle: 'italic' }}
                          onClick={() => updateAnnotation(ann.id, { italic: !ann.italic })}
                          title="Toggle Italic"
                        >
                          I
                        </button>

                        {/* Color preset */}
                        <input
                          type="color"
                          value={ann.color || '#0f172a'}
                          onChange={(e) => updateAnnotation(ann.id, { color: e.target.value })}
                          className="floating-color-picker"
                          title="Text color"
                        />
                      </>
                    )}

                    {/* Width adjustment */}
                    <button
                      type="button"
                      className="floating-btn"
                      onClick={() =>
                        updateAnnotation(ann.id, {
                          widthPercent: Math.max(8, ann.widthPercent - 4),
                        })
                      }
                      title="Shrink width"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      className="floating-btn"
                      onClick={() =>
                        updateAnnotation(ann.id, {
                          widthPercent: Math.min(95, ann.widthPercent + 4),
                        })
                      }
                      title="Enlarge width"
                    >
                      +
                    </button>

                    {/* Duplicate button */}
                    <button
                      type="button"
                      className="floating-btn"
                      onClick={() => duplicateAnnotation(ann.id)}
                      title="Duplicate"
                    >
                      <Sparkles size={13} />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      className="floating-btn danger"
                      onClick={() => deleteAnnotation(ann.id)}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Signature Creation Modal */}
      <AnimatePresence>
        {isSignModalOpen && (
          <div className="sig-modal-backdrop" onClick={() => setIsSignModalOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="sig-modal-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sig-modal-header">
                <div>
                  <h3>Create Your Signature</h3>
                  <p>Draw, type, or upload your signature to place on the document.</p>
                </div>
                <button
                  type="button"
                  className="sig-close-btn"
                  onClick={() => setIsSignModalOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Tabs */}
              <div className="sig-tabs">
                <button
                  type="button"
                  className={`sig-tab-btn ${sigTab === 'draw' ? 'active' : ''}`}
                  onClick={() => setSigTab('draw')}
                >
                  <PenTool size={15} />
                  <span>Draw</span>
                </button>
                <button
                  type="button"
                  className={`sig-tab-btn ${sigTab === 'type' ? 'active' : ''}`}
                  onClick={() => setSigTab('type')}
                >
                  <Type size={15} />
                  <span>Type</span>
                </button>
                <button
                  type="button"
                  className={`sig-tab-btn ${sigTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setSigTab('upload')}
                >
                  <Upload size={15} />
                  <span>Upload</span>
                </button>
              </div>

              {/* TAB 1: DRAW */}
              {sigTab === 'draw' && (
                <div className="sig-tab-content">
                  <div className="sig-draw-area">
                    <canvas
                      ref={drawPadRef}
                      width={480}
                      height={180}
                      className="sig-pad-canvas"
                      onMouseDown={startDrawing}
                      onMouseMove={drawSignature}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={drawSignature}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="sig-pad-baseline" />
                  </div>

                  <div className="sig-controls-row">
                    <div className="color-swatches">
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ink:</span>
                      {['#0f172a', '#1e3a8a', '#dc2626', '#059669'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`color-swatch ${sigColor === c ? 'active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setSigColor(c)}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: 13 }}
                      onClick={clearSignaturePad}
                    >
                      Clear Pad
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: TYPE */}
              {sigTab === 'type' && (
                <div className="sig-tab-content">
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />

                  <div className="font-options-grid">
                    {[
                      { id: 'cursive-1', label: 'Calligraphy Script', style: { fontFamily: '"Dancing Script", cursive', fontSize: 26 } },
                      { id: 'cursive-2', label: 'Classic Formal', style: { fontFamily: '"Times New Roman", serif', fontStyle: 'italic', fontSize: 24 } },
                      { id: 'cursive-3', label: 'Casual Hand', style: { fontFamily: '"Caveat", cursive', fontSize: 26 } },
                      { id: 'cursive-4', label: 'Executive Signature', style: { fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 'bold', fontSize: 22 } },
                    ].map((f) => (
                      <div
                        key={f.id}
                        className={`sig-font-card ${selectedFont === f.id ? 'active' : ''}`}
                        onClick={() => setSelectedFont(f.id)}
                      >
                        <span style={{ ...f.style, color: sigColor }}>
                          {typedName || 'Your Signature'}
                        </span>
                        <small>{f.label}</small>
                      </div>
                    ))}
                  </div>

                  <div className="sig-controls-row" style={{ marginTop: 16 }}>
                    <div className="color-swatches">
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ink:</span>
                      {['#0f172a', '#1e3a8a', '#dc2626', '#059669'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`color-swatch ${sigColor === c ? 'active' : ''}`}
                          style={{ background: c }}
                          onClick={() => setSigColor(c)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: UPLOAD */}
              {sigTab === 'upload' && (
                <div className="sig-tab-content">
                  <label className="sig-upload-box">
                    <Upload size={32} color="#38bdf8" style={{ marginBottom: 10 }} />
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      Click to upload signature image
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Supports transparent PNG or JPG
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      style={{ display: 'none' }}
                      onChange={handleSignatureUpload}
                    />
                  </label>
                </div>
              )}

              {/* Modal Actions */}
              <div className="sig-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsSignModalOpen(false)}
                >
                  Cancel
                </button>

                {sigTab !== 'upload' && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={applySignature}
                  >
                    <span>Place Signature on Document</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
