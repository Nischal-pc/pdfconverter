'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadAndProcess, saveHistoryItem } from '@/lib/api';
import { getApiBase } from '@/lib/apiBase';
import { useAuth } from '@/context/AuthContext';
import { TOOL_OPTIONS, isOptionVisible } from '@/lib/tools';
import { TOOL_HINTS } from '@/lib/toolHints';
import { getPdfPageCount } from '@/lib/pdfMeta';
import FileDropzone from './FileDropzone';
import DragReorderList from './DragReorderList';
import ProgressBar from './ProgressBar';
import toast from 'react-hot-toast';
import PDFPreview from './PDFPreview';
import VisualPDFEditor from './VisualPDFEditor';
import { triggerFileDownload, viewFileInBrowser } from '@/lib/download';
import { Eye, Download, PenTool, SlidersHorizontal } from 'lucide-react';

export default function ToolProcessor({ tool }) {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [orderedFiles, setOrderedFiles] = useState([]);
  const [options, setOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [result, setResult] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [pageCount, setPageCount] = useState(null);
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' | 'batch'

  // Reset state when tool changes
  useEffect(() => {
    Promise.resolve().then(() => {
      setFiles([]);
      setOrderedFiles([]);
      setOptions({});
      setSignatureFile(null);
      setPageCount(null);
      setResult(null);
      setLoading(false);
      setProgress(0);

      const toolOpts = TOOL_OPTIONS[tool.id] || [];
      const defaults = {};
      toolOpts.forEach((opt) => {
        if (opt.default !== undefined) {
          defaults[opt.id] = opt.default;
        }
      });
      if (tool.id === 'sign-pdf') {
        defaults.pageScope = 'all';
      }
      setOptions(defaults);
    });
  }, [tool]);

  useEffect(() => {
    if (!tool.showsPageCount || files.length !== 1 || files[0].type !== 'application/pdf') {
      Promise.resolve().then(() => setPageCount(null));
      return;
    }
    getPdfPageCount(files[0]).then(setPageCount);
  }, [files, tool]);

  const handleFiles = (newFiles) => {
    if (tool.multi) {
      const updated = [...files, ...newFiles];
      setFiles(updated);
      setOrderedFiles(updated.map((f, idx) => ({ id: `${f.name}-${idx}-${Date.now()}`, label: f.name, file: f })));
    } else {
      setFiles([newFiles[0]]);
      setOrderedFiles([{ id: `${newFiles[0].name}-0`, label: newFiles[0].name, file: newFiles[0] }]);
    }
    setResult(null);
  };

  const handleRemove = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    if (tool.multi) {
      setOrderedFiles(orderedFiles.filter((_, i) => i !== idx));
    } else {
      setOrderedFiles([]);
    }
  };

  const handleReorder = (newOrder) => {
    setOrderedFiles(newOrder);
    setFiles(newOrder.map((item) => item.file));
  };

  const handleOptionChange = (id, val) => {
    setOptions({ ...options, [id]: val });
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please upload at least one file.');
      return;
    }

    if (tool.id === 'merge' && files.length < 2) {
      toast.error('Merge PDF requires at least 2 files.');
      return;
    }

    if (tool.id === 'sign-pdf' && options.signType === 'image' && !signatureFile) {
      toast.error('Please upload a signature image (PNG or JPG).');
      return;
    }

    setLoading(true);
    setProgress(0);
    setProgressLabel('Uploading files...');

    const formData = new FormData();
    // Append files
    if (tool.multi) {
      files.forEach((file) => {
        formData.append('files', file);
      });
    } else {
      formData.append('file', files[0]);
    }

    const payload = { ...options };
    if (tool.id === 'sign-pdf' && !payload.pageScope) {
      payload.pageScope = 'all';
    }
    if (!payload.dateLabel && payload.includeDate !== 'false') {
      payload.dateLabel = new Date().toLocaleDateString();
    }

    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== '') {
        formData.append(key, payload[key]);
      }
    });

    if (tool.hasSignatureUpload && signatureFile) {
      formData.append('signature', signatureFile);
    }

    try {
      const data = await uploadAndProcess(tool.endpoint, formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percent * 0.8); // 80% is upload
        if (percent === 100) {
          setProgressLabel('Processing files on server...');
          setProgress(90);
        }
      });

      setProgress(100);
      setProgressLabel('Done!');
      setResult(data);
      toast.success('Successfully processed file!');

      // Save to local storage history if user is not logged in, or handled by middleware on server
      // We will save to local history in either case to ensure history works offline/local
      try {
        const fileExtMatch = data.filename ? data.filename.match(/\.[a-zA-Z0-9]+$/) : null;
        const outExt = fileExtMatch ? fileExtMatch[0] : '.pdf';
        const firstInputName = files[0]?.name?.replace(/\.[^/.]+$/, '') || 'document';
        const friendlyOutName = `${firstInputName}-${tool.id}${outExt}`;

        const savedHistory = JSON.parse(localStorage.getItem('pdf_history') || '[]');
        const historyItem = {
          id: Date.now().toString(),
          toolId: tool.id,
          toolLabel: tool.label,
          inputFiles: files.map((f) => f.name).join(', '),
          outputFile: data.filename || friendlyOutName,
          downloadUrl: data.downloadUrl,
          createdAt: new Date().toISOString(),
          status: 'success',
        };
        localStorage.setItem('pdf_history', JSON.stringify([historyItem, ...savedHistory].slice(0, 50)));

        if (user) {
          saveHistoryItem({
            toolId: tool.id,
            toolLabel: tool.label,
            inputFiles: historyItem.inputFiles,
            outputFile: historyItem.outputFile,
            downloadUrl: historyItem.downloadUrl,
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Failed to save to local history:', err);
      }

    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'An error occurred during processing.';
      toast.error(errMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toolOpts = TOOL_OPTIONS[tool.id] || [];
  const visibleOpts = toolOpts.filter((opt) => isOptionVisible(opt, options));

  const pagesTargetLabel = () => {
    if (!pageCount) return null;
    const scope = options.pageScope || 'all';
    if (scope === 'all') return `Will apply to all ${pageCount} page${pageCount === 1 ? '' : 's'}`;
    if (scope === 'first') return 'Will apply to page 1 only';
    if (scope === 'last') return `Will apply to page ${pageCount} only`;
    return `Custom selection on ${pageCount}-page document`;
  };

  const handleVisualDone = (data) => {
    setResult(data);
    try {
      const firstInputName = files[0]?.name?.replace(/\.[^/.]+$/, '') || 'document';
      const friendlyOutName = `${firstInputName}-signed.pdf`;

      const savedHistory = JSON.parse(localStorage.getItem('pdf_history') || '[]');
      const historyItem = {
        id: Date.now().toString(),
        toolId: tool.id,
        toolLabel: tool.label,
        inputFiles: files.map((f) => f.name).join(', '),
        outputFile: data.filename || friendlyOutName,
        downloadUrl: data.downloadUrl,
        createdAt: new Date().toISOString(),
        status: 'success',
      };
      localStorage.setItem('pdf_history', JSON.stringify([historyItem, ...savedHistory].slice(0, 50)));

      if (user) {
        saveHistoryItem({
          toolId: tool.id,
          toolLabel: tool.label,
          inputFiles: historyItem.inputFiles,
          outputFile: historyItem.outputFile,
          downloadUrl: historyItem.downloadUrl,
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to save to local history:', err);
    }
  };

  const isVisualTool = tool.id === 'sign-pdf' || tool.id === 'add-text';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="tool-processor-panel"
    >
      <div className={`tool-processor-grid${(files.length > 0 || result) && !(isVisualTool && editorMode === 'visual' && files.length === 1) ? ' has-sidebar' : ''}`}>
        <div className="processor-main" style={{ width: '100%' }}>
          {/* File Upload Zone */}
          {files.length === 0 && !result && (
            <FileDropzone
              accept={tool.accept}
              multiple={tool.multi}
              onFiles={handleFiles}
            />
          )}

          {/* List of files selected / Drag list */}
          {files.length > 0 && !result && (
            <div>
              <div className="files-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span>Selected File{files.length > 1 ? 's' : ''} ({files.length})</span>
                  {isVisualTool && files.length === 1 && files[0].type === 'application/pdf' && (
                    <div className="sig-tabs" style={{ padding: 2 }}>
                      <button
                        type="button"
                        className={`sig-tab-btn ${editorMode === 'visual' ? 'active' : ''}`}
                        style={{ padding: '4px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => setEditorMode('visual')}
                      >
                        <PenTool size={13} />
                        <span>Sign &amp; Type Anywhere</span>
                      </button>
                      <button
                        type="button"
                        className={`sig-tab-btn ${editorMode === 'batch' ? 'active' : ''}`}
                        style={{ padding: '4px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => setEditorMode('batch')}
                      >
                        <SlidersHorizontal size={13} />
                        <span>Batch Options</span>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setFiles([]); setOrderedFiles([]); }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Change File
                </button>
              </div>

              {/* Interactive Visual PDF Editor */}
              {isVisualTool && editorMode === 'visual' && files.length === 1 && files[0].type === 'application/pdf' ? (
                <VisualPDFEditor
                  file={files[0]}
                  onDone={handleVisualDone}
                  onCancel={() => { setFiles([]); setOrderedFiles([]); }}
                />
              ) : tool.multi ? (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Drag items by the handle to reorder. Add more files below if needed.
                  </div>
                  <DragReorderList items={orderedFiles} onChange={handleReorder} />
                  <div style={{ marginTop: 16 }}>
                    <FileDropzone
                      accept={tool.accept}
                      multiple
                      onFiles={handleFiles}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <FileDropzone
                    accept={tool.accept}
                    multiple={tool.multi}
                    files={files}
                    onFiles={handleFiles}
                    onRemove={handleRemove}
                  />
                  {files.length === 1 && files[0].type === 'application/pdf' && (
                    <PDFPreview file={files[0]} />
                  )}
                </>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {loading && (
            <ProgressBar progress={progress} label={progressLabel} />
          )}

          {/* Result Block */}
          {result && (
            <div className="download-card download-card-inner">
              <div style={{ fontSize: 48 }}>🎉</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Your file is ready!</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Downloaded file can be saved directly to your computer.
                  {result.pagesSigned != null && (
                    <> Signed <strong>{result.pagesSigned}</strong> of <strong>{result.totalPages}</strong> pages.</>
                  )}
                  {result.pagesModified != null && result.pagesSigned == null && (
                    <> Modified <strong>{result.pagesModified}</strong> page(s).</>
                  )}
                </p>
              </div>

              {/* Extras if compress */}
              {result.reduction && (
                <div className="stat-row">
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Original</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(result.originalSize / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Compressed</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{(result.compressedSize / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Reduced</div>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>{result.reduction}</div>
                  </div>
                </div>
              )}

              {/* Extras if PDF to Text */}
              {result.text && (
                <div className="result-block">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Text Preview:</div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(result.text).then(() => toast.success('Copied to clipboard!')).catch(() => toast.error('Copy failed'));
                      }}
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '3px 10px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                  <pre>
                    {result.text}
                  </pre>
                </div>
              )}

              {/* Extras if Text Extracted (PDF to Text / Word to Text / Image to Text) */}
              {result.text && !result.summary && (
                <div className="result-block" style={{ padding: 18, fontSize: 13, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Extracted Text Preview:</div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(result.text).then(() => toast.success('Copied to clipboard!')).catch(() => toast.error('Copy failed'));
                      }}
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '4px 12px', cursor: 'pointer' }}
                    >
                      Copy Text
                    </button>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 12, padding: 10, background: 'rgba(0,0,0,0.3)', borderRadius: 8 }}>
                    {result.text}
                  </div>
                </div>
              )}

              {/* Extras if Word to HTML */}
              {result.htmlPreview && (
                <div className="result-block" style={{ padding: 18, fontSize: 13, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HTML Output Preview:</div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(result.htmlPreview).then(() => toast.success('HTML copied to clipboard!')).catch(() => toast.error('Copy failed'));
                      }}
                      style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '4px 12px', cursor: 'pointer' }}
                    >
                      Copy HTML
                    </button>
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', lineHeight: 1.5, color: 'var(--text-primary)', padding: 12, background: '#ffffff', color: '#1e293b', borderRadius: 8 }} dangerouslySetInnerHTML={{ __html: result.htmlPreview }} />
                </div>
              )}

              {/* Extras if Summarize */}
              {result.summary && (
                <div className="result-block" style={{ padding: 20, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Summary:</div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(result.summary).then(() => toast.success('Copied to clipboard!')).catch(() => toast.error('Copy failed'));
                      }}
                      style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 6, color: 'var(--accent)', fontSize: 11, fontWeight: 600, padding: '3px 10px', cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                  </div>
                  <div style={{ lineHeight: 1.6, color: 'var(--text-primary)' }}>
                    {result.summary}
                  </div>
                  <div className="meta-row" style={{ marginTop: 12 }}>
                    <span>Original size: {result.originalLength} chars</span>
                    <span>•</span>
                    <span>Summary size: {result.summaryLength} chars</span>
                    <span>•</span>
                    <span>Compressed: {result.compressionRatio}</span>
                  </div>
                </div>
              )}

              {/* Extras if Word Count tool */}
              {result.wordCount != null && (
                <div className="stat-row" style={{ marginBottom: 16 }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Words</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{result.wordCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Characters</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-blue)', fontFamily: 'JetBrains Mono, monospace' }}>{result.charCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Read Time</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>{result.readingTime}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Words/Pg</div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{result.avgWordsPerPage}</div>
                  </div>
                </div>
              )}

              {/* Extras if OCR result has charCount + method */}
              {result.charCount != null && !result.summary && !result.reduction && !result.wordCount && (
                <div className="meta-row" style={{ justifyContent: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Characters extracted: <strong style={{ color: 'var(--text-secondary)' }}>{result.charCount.toLocaleString()}</strong></span>
                  {result.method && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                      background: result.method === 'digital-extraction' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                      border: `1px solid ${result.method === 'digital-extraction' ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)'}`,
                      color: result.method === 'digital-extraction' ? '#10b981' : 'var(--accent)',
                    }}>
                      {result.method === 'digital-extraction' ? '⚡ Digital extraction' : '👁 OCR'}
                    </span>
                  )}
                </div>
              )}

              {/* Extras if remove-pages */}
              {result.pagesRemoved != null && (
                <div className="stat-row">
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pages Removed</div>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>{result.pagesRemoved}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Pages Remaining</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{result.pagesRemaining}</div>
                  </div>
                </div>
              )}

              {/* Extras if Multi-file (Split / PDF to JPG) */}
              {result.files && (
                <div className="result-block" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Extracted Files ({result.files.length}):</div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.files.map((file, i) => (
                      <div key={i} className="file-result-row">
                        <span style={{ color: 'var(--text-primary)' }}>
                          {file.filename.split('-').slice(1).join('-')} {file.pages ? `(Pages: ${file.pages})` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => triggerFileDownload(file.downloadUrl, file.filename || `extracted-page-${i + 1}.pdf`)}
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="result-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {result.downloadUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => viewFileInBrowser(result.downloadUrl)}
                      className="btn-primary"
                    >
                      <Eye size={16} />
                      <span>View in Browser</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerFileDownload(result.downloadUrl, result.filename || 'Processed-Document.pdf')}
                      className="btn-secondary"
                    >
                      <Download size={16} />
                      <span>Download File</span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => { setFiles([]); setOrderedFiles([]); setResult(null); }}
                >
                  Process Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Options Panel */}
        {(files.length > 0 || result) && !(isVisualTool && editorMode === 'visual' && files.length === 1 && !result) && (
          <div className="options-panel">
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: '#38bdf8' }}>
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                <span>Advanced Options</span>
              </h3>

              {TOOL_HINTS[tool.id] && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
                  {TOOL_HINTS[tool.id]}
                </p>
              )}

              {pagesTargetLabel() && (
                <div className="page-scope-banner">
                  ✓ {pagesTargetLabel()}
                </div>
              )}

              {!result ? (
                <form onSubmit={handleProcess} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {toolOpts.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      No options required for this tool. Just press the button below to start processing.
                    </div>
                  ) : (
                    visibleOpts.map((opt) => (
                      <div key={opt.id} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {opt.label} {opt.required && <span style={{ color: '#ef4444' }}>*</span>}
                        </label>
                        {opt.type === 'select' ? (
                          <select
                            className="input-field"
                            value={options[opt.id] || ''}
                            onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                            style={{ appearance: 'none', background: 'var(--bg-secondary) url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'none\' stroke=\'%239494b8\' stroke-width=\'2\'><path d=\'M2 4l4 4 4-4\'/></svg>") no-repeat right 16px center' }}
                          >
                            {opt.options.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        ) : opt.type === 'color' ? (
                          <div className="color-input-row">
                            <input
                              type="color"
                              value={options[opt.id] || opt.default || '#000000'}
                              onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                              style={{ width: 48, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                            />
                            <input
                              type="text"
                              className="input-field"
                              value={options[opt.id] || opt.default || '#000000'}
                              onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                            />
                          </div>
                        ) : opt.type === 'textarea' ? (
                          <textarea
                            className="input-field"
                            rows={4}
                            placeholder={opt.placeholder}
                            required={opt.required}
                            value={options[opt.id] || ''}
                            onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                            style={{ resize: 'vertical', minHeight: 88 }}
                          />
                        ) : opt.type === 'toggle' ? (
                          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                            <input
                              type="checkbox"
                              checked={options[opt.id] === 'true' || options[opt.id] === true}
                              onChange={(e) => handleOptionChange(opt.id, e.target.checked ? 'true' : 'false')}
                              style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>{options[opt.id] === 'true' ? 'Enabled' : 'Disabled'}</span>
                          </label>
                        ) : (
                          <input
                            type={opt.type === 'password' ? 'password' : 'text'}
                            className="input-field"
                            placeholder={opt.placeholder}
                            required={opt.required}
                            value={options[opt.id] || ''}
                            onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                          />
                        )}
                      </div>
                    ))
                  )}

                  {tool.hasSignatureUpload && options.signType === 'image' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Signature image <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="input-field"
                        onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                      />
                      {signatureFile && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{signatureFile.name}</span>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                    style={{ width: '100%', marginTop: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                  >
                    <span>{loading ? 'Processing...' : `${tool.label}`}</span>
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Processing completed successfully. You can download the output file, or click &quot;Process Another&quot; to clear the state and process more files.
                  </div>
                  <div style={{ height: 1, background: 'var(--border)' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Filename: <br />
                    <span style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{result.filename || 'Multiple output files'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </motion.div>
  );
}
