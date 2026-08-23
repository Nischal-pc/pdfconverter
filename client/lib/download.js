import { getApiBase } from './apiBase';
import JSZip from 'jszip';

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
 * Triggers a direct, reliable download across iOS Safari, Chrome on Mac/Windows/Android.
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

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  // Detect iOS: native Safari, Chrome on iOS (CriOS), Firefox on iOS (FxiOS)
  const isIOS = /iPad|iPhone|iPod/i.test(ua) ||
    /CriOS/i.test(ua) ||
    /FxiOS/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // Detect Android
  const isAndroid = /Android/i.test(ua);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = finalUrl;
  a.setAttribute('download', cleanName);
  a.download = cleanName;

  if (isIOS) {
    // iOS Safari / Chrome: open in new tab — triggers native download/preview sheet
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  } else if (isAndroid && isCreatedBlob && navigator.share && navigator.canShare) {
    // Android Chrome: try Web Share API with File (native intent for saving)
    try {
      const blob = dataUrlToBlob(downloadUrl);
      if (blob) {
        const shareFile = new File([blob], cleanName, { type: blob.type });
        if (navigator.canShare({ files: [shareFile] })) {
          navigator.share({ files: [shareFile], title: cleanName }).catch(() => {
            // If share fails, fall through to anchor click
            document.body.appendChild(a);
            a.click();
          });
          setTimeout(() => {
            if (document.body.contains(a)) document.body.removeChild(a);
            if (isCreatedBlob) URL.revokeObjectURL(finalUrl);
          }, 30000);
          return;
        }
      }
    } catch (_) { /* fall through */ }
  }

  document.body.appendChild(a);
  a.click();

  // 30 seconds — mobile browsers need more time to initiate the download
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    if (isCreatedBlob) {
      URL.revokeObjectURL(finalUrl);
    }
  }, 30000);
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

/**
 * Downloads multiple files bundled into a single in-memory .zip archive.
 */
export async function downloadFilesAsZip(fileList, zipFilename = 'PdfFlow-Export.zip') {
  if (typeof window === 'undefined' || !fileList || !fileList.length) return;

  const zip = new JSZip();

  for (let i = 0; i < fileList.length; i++) {
    const item = fileList[i];
    const url = item.downloadUrl || item.url;
    const name = item.filename || `extracted-page-${i + 1}.pdf`;

    if (!url) continue;

    if (url.startsWith('data:')) {
      const parts = url.split(',');
      zip.file(name, parts[1], { base64: true });
    } else {
      try {
        const fullUrl = url.startsWith('http') ? url : `${getApiBase()}/uploads/${url.replace(/^\/(uploads|api\/download)\//, '')}`;
        const resp = await fetch(fullUrl);
        const blob = await resp.blob();
        zip.file(name, blob);
      } catch (err) {
        console.warn(`Failed to fetch ${name} for zip bundle:`, err);
      }
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(zipBlob);

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = blobUrl;
  a.download = zipFilename.endsWith('.zip') ? zipFilename : `${zipFilename}.zip`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (document.body.contains(a)) document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  }, 10000);
}

/**
 * Triggers native Web Share on mobile/desktop if supported.
 */
export async function shareDocument(downloadUrl, filename = 'Document.pdf') {
  if (typeof window === 'undefined' || !navigator.share) return false;

  try {
    let fileToShare = null;
    if (downloadUrl.startsWith('data:')) {
      const blob = dataUrlToBlob(downloadUrl);
      if (blob) fileToShare = new File([blob], filename, { type: blob.type });
    } else {
      const fullUrl = downloadUrl.startsWith('http') ? downloadUrl : `${getApiBase()}/uploads/${downloadUrl.replace(/^\/(uploads|api\/download)\//, '')}`;
      const resp = await fetch(fullUrl);
      const blob = await resp.blob();
      fileToShare = new File([blob], filename, { type: blob.type });
    }

    if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
      await navigator.share({
        files: [fileToShare],
        title: filename,
      });
      return true;
    } else {
      await navigator.share({
        title: filename,
        url: window.location.href,
      });
      return true;
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('Share failed:', err);
    }
    return false;
  }
}