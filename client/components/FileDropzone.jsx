'use client';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';

// MIME type map for healing files that iOS/Android sends as octet-stream or empty
const EXT_MIME_MAP = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  txt: 'text/plain',
  md: 'text/markdown',
  markdown: 'text/markdown',
  csv: 'text/csv',
  html: 'text/html',
  htm: 'text/html',
};

/**
 * Heals a File object that has a missing or generic MIME type (iOS/Android quirk).
 * Re-creates the File with the correct MIME based on the file extension.
 */
function healFileMime(file) {
  if (!file) return file;
  const ext = (file.name || '').split('.').pop().toLowerCase();
  const correctMime = EXT_MIME_MAP[ext];
  if (!correctMime) return file;
  // Only heal if MIME is missing, empty, or generic octet-stream
  if (!file.type || file.type === 'application/octet-stream' || file.type === '') {
    return new File([file], file.name, { type: correctMime, lastModified: file.lastModified });
  }
  return file;
}

/**
 * Detects iOS or Android touch device for input accept override.
 * iPhone/iPad use Apple UTIs that confuse the file picker when accept is strict.
 */
function isMobileBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod|Android/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function FileDropzone({ accept, multiple = false, onFiles, files = [], onRemove }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(isMobileBrowser());
  }, []);

  const onDrop = useCallback((accepted, fileRejections) => {
    let rawFiles = accepted ? [...accepted] : [];

    // Fallback for iOS Safari / macOS Chrome where Apple UTI or empty MIME causes react-dropzone rejection
    if (fileRejections && fileRejections.length > 0) {
      fileRejections.forEach(({ file }) => {
        if (file && !rawFiles.some((f) => f.name === file.name && f.size === file.size)) {
          rawFiles.push(file);
        }
      });
    }

    // Heal MIME types — iOS sends PDFs as 'application/octet-stream'
    const finalFiles = rawFiles.map(healFileMime);

    if (finalFiles.length > 0) {
      onFiles(finalFiles);
    }
  }, [onFiles]);

  // Global Clipboard paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            const ext = file.type?.includes('/') ? `.${file.type.split('/')[1].replace('jpeg', 'jpg')}` : '.png';
            const cleanFileName = file.name && file.name !== 'image.png' ? file.name : `Pasted-File-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}${ext}`;
            const namedFile = new File([file], cleanFileName, { type: file.type || 'image/png' });
            pastedFiles.push(namedFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        if (multiple) {
          onFiles(pastedFiles);
        } else {
          onFiles([pastedFiles[0]]);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [onFiles, multiple]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // On iOS/Android: bypass strict MIME accept to show all files in the OS picker.
    // Server-side magic byte validation handles security — we can't trust browser MIME strings.
    accept: isMobile ? undefined : accept,
    multiple,
    useFsAccessApi: false, // Prevents File System Access API freezes on iOS & Mac Chrome
  });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return <ImageIcon size={18} />;
    if (file.type?.includes('pdf')) return <FileText size={18} />;
    return <Paperclip size={18} />;
  };

  return (
    <div style={{ width: '100%' }}>
      <div {...getRootProps()} className={`dropzone-container ${isDragActive ? 'is-active' : ''}`}>
        <input {...getInputProps()} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="dropzone-icon">
            <UploadCloud size={24} />
          </div>

          <div className="dropzone-title">
            {isDragActive ? 'Drop files to upload instantly' : 'Drag & drop files here'}
          </div>
          <div className="dropzone-subtitle" style={{ marginBottom: 20 }}>
            or click to browse from your device
          </div>
          <button
            className="btn-primary"
            type="button"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'none' }}
          >
            <span>Choose {multiple ? 'Files' : 'File'}</span>
          </button>
        </div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {files.map((file, idx) => (
              <motion.div
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="file-item"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  flexShrink: 0,
                  background: 'var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-primary)'
                }}>
                  {getFileIcon(file)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {formatSize(file.size)}
                  </div>
                </div>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(idx)}
                    aria-label={`Remove ${file.name}`}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      width: 28,
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
