'use client';
import { useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';

export default function FileDropzone({ accept, multiple = false, onFiles, files = [], onRemove }) {
  const onDrop = useCallback((accepted) => {
    if (accepted && accepted.length > 0) {
      onFiles(accepted);
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
    accept,
    multiple,
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
