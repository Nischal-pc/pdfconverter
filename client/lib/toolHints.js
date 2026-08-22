export const TOOL_HINTS = {
  // Organize
  merge: 'Drag the file handles to reorder PDFs before merging. You can optionally set a title and author — these are embedded in the output PDF\'s metadata.',
  split: 'Leave ranges empty to export every page as its own PDF file. Enter ranges like "1-3,4-6" to split into chunks.',
  'remove-pages': 'Enter page numbers to delete, separated by commas. You can use ranges: e.g. "1,3,5-7" removes pages 1, 3, and 5 through 7.',
  'extract-pages': 'Specify the pages you want to keep in the output PDF. Example: "1,3,5-7" extracts pages 1, 3, and 5–7.',
  organize: 'Enter the new page order as a comma-separated list of page numbers. Example: "3,1,2,4" makes page 3 the new first page.',

  // Optimize
  compress: 'Screen quality gives the smallest file; Prepress keeps maximum fidelity. If Ghostscript is not installed, the server uses a fallback compressor.',
  repair: 'Repair rebuilds and re-saves the PDF structure using pdf-lib. Useful for PDFs that fail to open or render correctly.',

  // Convert to PDF
  'jpg-to-pdf': 'Upload one or more images (JPG, PNG, WebP, etc.) and they will be combined into a single PDF. "Fit to A4" scales images to a standard page size.',
  'word-to-pdf': 'Converts Word documents (.docx, .doc) to PDF using LibreOffice on the server. Make sure LibreOffice is installed for this tool to work.',
  'ppt-to-pdf': 'Converts PowerPoint files (.pptx, .ppt) to PDF using LibreOffice. Each slide becomes a PDF page.',
  'excel-to-pdf': 'Converts Excel spreadsheets (.xlsx, .xls) to PDF using LibreOffice. All sheets are included in the output.',

  // Convert from PDF
  'pdf-to-jpg': 'Exports each PDF page as a high-DPI JPEG image. Requires Ghostscript on the server. Higher DPI = better quality but larger files.',
  'pdf-to-text': 'Extracts all selectable text from the PDF. Works on digital PDFs. For scanned documents, use OCR instead.',
  'pdf-to-word': 'Converts PDF text to an editable .docx file. Formatting may not be preserved — works best on text-heavy documents.',

  // Edit
  'sign-pdf': 'By default your signature is placed on every page. Use "Custom pages" only if you need specific pages.',
  'add-text': 'Use "All pages" to stamp the same text on each page. Coordinates are measured from the bottom-left corner (PDF standard).',
  highlight: 'Set "All pages" to repeat the highlight box on every page at the same position.',
  rotate: 'Leave pages empty to rotate the entire document. You can target a specific page with "Custom page list".',
  watermark: 'Tile mode repeats the watermark across the sheet; "All pages" applies to the full document.',
  'page-numbers': 'Page numbers are added to every page. Use "Page X of Y" format for a professional look.',

  // Security
  protect: 'The user password is required to open the file. The owner password (optional) controls editing and printing permissions.',
  unlock: 'If the PDF has a password, enter it here to remove protection. Leave blank if the PDF is not password-protected.',

  // AI
  ocr: 'For digital PDFs (with selectable text), text is extracted instantly. For scanned/image PDFs, Tesseract OCR is used.',
  summarize: 'Uses extractive NLP to identify the most important sentences in your document. Works on digital PDFs only.',
};
