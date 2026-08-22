import { getApiBase } from './apiBase';

/**
 * Converts a Base64 data URL to an in-memory browser Blob.
 */
function dataUrlToBlob(dataUrl) {
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error('Failed to convert data URL to Blob:', err);
    return null;
  }
}

/**
 * Triggers a direct, reliable download in Chrome memory.
 */
export function triggerFileDownload(downloadUrl, filename = 'Document.pdf') {
  if (typeof window === 'undefined' || !downloadUrl) return;

  let finalUrl = downloadUrl;
  let isCreatedBlob = false;

  if (downloadUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(downloadUrl);
    if (blob) {
      finalUrl = URL.createObjectURL(blob);
      isCreatedBlob = true;
    }
  } else if (!downloadUrl.startsWith('http') && !downloadUrl.startsWith('blob:')) {
    const base = getApiBase();
    const fileKey = downloadUrl.replace(/^\/(uploads|api\/download)\//, '');
    finalUrl = `${base}/uploads/${fileKey}`;
  }

  const urlExtMatch = filename.match(/\.([a-zA-Z0-9]+)$/) || downloadUrl.match(/\.([a-zA-Z0-9]+)$/);
  const realExt = urlExtMatch ? `.${urlExtMatch[1].toLowerCase()}` : '.pdf';

  let cleanName = (filename || `Document${realExt}`).trim();
  if (!cleanName.toLowerCase().endsWith(realExt)) {
    cleanName = `${cleanName.replace(/\.[^/.]+$/, '')}${realExt}`;
  }
  cleanName = cleanName.replace(/[\\/:*?"<>|]/g, '_');

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = finalUrl;
  a.setAttribute('download', cleanName);
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    if (isCreatedBlob) {
      URL.revokeObjectURL(finalUrl);
    }
  }, 10000);
}

/**
 * Opens the file in a new browser tab for preview.
 */
export function viewFileInBrowser(downloadUrl) {
  if (typeof window === 'undefined' || !downloadUrl) return;

  if (downloadUrl.startsWith('data:')) {
    const blob = dataUrlToBlob(downloadUrl);
    if (blob) {
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      return;
    }
  }

  if (downloadUrl.startsWith('http') || downloadUrl.startsWith('blob:')) {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    return;
  }

  const base = getApiBase();
  const fileKey = downloadUrl.replace(/^\/(uploads|api\/download)\//, '');
  window.open(`${base}/uploads/${fileKey}`, '_blank', 'noopener,noreferrer');
}