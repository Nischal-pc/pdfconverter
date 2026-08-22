import api from './api';

/** Read PDF page count (client pdf.js, fallback to API) */
export async function getPdfPageCount(file) {
  if (!file || file.type !== 'application/pdf') return null;

  try {
    const pdfjs = await import('pdfjs-dist');
    if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    }
    const data = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data }).promise;
    const count = doc.numPages;
    await doc.destroy();
    return count;
  } catch {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/api/pdf/page-count', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.pageCount;
    } catch (err) {
      console.warn('Could not read PDF page count:', err);
      return null;
    }
  }
}
