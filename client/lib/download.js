import { getApiBase } from './apiBase';

/**
 * Triggers a direct download pointing to the static /uploads/ file URL with download attribute.
 * This guarantees Chrome and Windows save the file as a valid .pdf file with its proper extension.
 */
export function triggerFileDownload(downloadUrl, filename = 'Signed-Document.pdf') {
  if (typeof window === 'undefined' || !downloadUrl) return;

  const base = getApiBase();
  let staticUrl = downloadUrl;
  if (!downloadUrl.startsWith('http')) {
    const fileKey = downloadUrl.replace(/^\/(uploads|api\/download)\//, '');
    staticUrl = `${base}/uploads/${fileKey}`;
  }

  const urlExtMatch = downloadUrl.match(/\.([a-zA-Z0-9]+)$/);
  const realExt = urlExtMatch ? `.${urlExtMatch[1].toLowerCase()}` : '.pdf';

  let cleanName = (filename || `Document${realExt}`).trim();
  if (!cleanName.toLowerCase().endsWith(realExt)) {
    cleanName = `${cleanName.replace(/\.[^/.]+$/, '')}${realExt}`;
  }
  cleanName = cleanName.replace(/[\\/:*?"<>|]/g, '_');

  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = staticUrl;
  a.setAttribute('download', cleanName);
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 2000);
}