import { FolderTree, Combine, Scissors, FileX, FileUp, ListOrdered, Zap, Minimize, Wrench, RefreshCw, Image as ImageIcon, FileText, Presentation, Table, Repeat, PenTool, Type, Highlighter, RotateCw, Droplet, Hash, Lock, Unlock, Brain, Eye, Bot, FileCode, Layers, Wand2, Sparkles, ImageDown } from 'lucide-react';

// Shared advanced option presets
const PAGE_SCOPE_FIELD = {
  id: 'pageScope',
  label: 'Apply to pages',
  type: 'select',
  required: false,
  options: [
    { value: 'all', label: 'All pages (entire document)' },
    { value: 'first', label: 'First page only' },
    { value: 'last', label: 'Last page only' },
    { value: 'custom', label: 'Custom page list' },
  ],
  default: 'all',
};

const CUSTOM_PAGES_FIELD = {
  id: 'page',
  label: 'Custom pages',
  type: 'text',
  placeholder: 'e.g. 1,3,5-8',
  required: false,
  showWhen: { pageScope: 'custom' },
};

// Tool definitions for all PDF tools
export const TOOL_CATEGORIES = [
  {
    id: 'organize',
    label: 'Organize PDF',
    emoji: <FolderTree size={24} />,
    color: 'from-violet-500 to-purple-600',
    tools: [
      { id: 'merge', label: 'Merge PDF', desc: 'Combine PDFs with custom order & metadata', icon: <Combine size={16} />, iconColor: '#7C3AED', endpoint: '/api/pdf/merge', multi: true, accept: { 'application/pdf': ['.pdf'] } },
      { id: 'split', label: 'Split PDF', desc: 'Split by ranges or into single pages', icon: <Scissors size={16} />, iconColor: '#8B5CF6', endpoint: '/api/pdf/split', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'remove-pages', label: 'Remove Pages', desc: 'Delete specific pages from a PDF', icon: <FileX size={16} />, iconColor: '#A78BFA', endpoint: '/api/pdf/remove-pages', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'extract-pages', label: 'Extract Pages', desc: 'Extract page ranges into a new PDF', icon: <FileUp size={16} />, iconColor: '#7C3AED', endpoint: '/api/pdf/extract-pages', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'organize', label: 'Organize PDF', desc: 'Reorder pages by custom sequence', icon: <ListOrdered size={16} />, iconColor: '#6D28D9', endpoint: '/api/pdf/organize', accept: { 'application/pdf': ['.pdf'] } },
    ],
  },
  {
    id: 'optimize',
    label: 'Optimize PDF',
    emoji: <Zap size={24} />,
    color: 'from-amber-500 to-orange-600',
    tools: [
      { id: 'compress', label: 'Compress PDF', desc: 'Advanced DPI presets for smaller files', icon: <Minimize size={16} />, iconColor: '#D97706', endpoint: '/api/pdf/compress', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'flatten', label: 'Flatten PDF', desc: 'Lock form fields & signatures into static vector pages', icon: <Layers size={16} />, iconColor: '#F59E0B', endpoint: '/api/pdf/flatten', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'grayscale', label: 'PDF to Grayscale', desc: 'Convert color pages to monochrome to save printer ink', icon: <Droplet size={16} />, iconColor: '#92400E', endpoint: '/api/pdf/grayscale', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'repair', label: 'Repair PDF', desc: 'Rebuild and fix corrupted PDF structure', icon: <Wrench size={16} />, iconColor: '#B45309', endpoint: '/api/pdf/repair', accept: { 'application/pdf': ['.pdf'] } },
    ],
  },
  {
    id: 'convert-to',
    label: 'Convert to PDF',
    emoji: <RefreshCw size={24} />,
    color: 'from-blue-500 to-cyan-600',
    tools: [
      { id: 'word-to-pdf', label: 'Word to PDF', desc: 'Convert .docx/.doc to PDF', icon: <FileText size={16} />, iconColor: '#2563EB', endpoint: '/api/convert/word-to-pdf', accept: { 'application/msword': ['.doc'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] } },
      { id: 'jpg-to-pdf', label: 'JPG to PDF', desc: 'Convert JPG/JPEG images to PDF', icon: <ImageIcon size={16} />, iconColor: '#0284C7', endpoint: '/api/convert/jpg-to-pdf', multi: true, accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
      { id: 'png-to-pdf', label: 'PNG to PDF', desc: 'Convert PNG images to PDF', icon: <ImageDown size={16} />, iconColor: '#0369A1', endpoint: '/api/convert/png-to-pdf', multi: true, accept: { 'image/png': ['.png'] } },
      { id: 'text-to-pdf', label: 'Text to PDF', desc: 'Convert plain text (.txt) files into clean PDF', icon: <FileText size={16} />, iconColor: '#1D4ED8', endpoint: '/api/convert/text-to-pdf', accept: { 'text/plain': ['.txt'] } },
      { id: 'ppt-to-pdf', label: 'PPT to PDF', desc: 'Convert PowerPoint to PDF', icon: <Presentation size={16} />, iconColor: '#C2410C', endpoint: '/api/convert/ppt-to-pdf', accept: { 'application/vnd.ms-powerpoint': ['.ppt'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] } },
      { id: 'excel-to-pdf', label: 'Excel to PDF', desc: 'Convert Excel sheets to PDF', icon: <Table size={16} />, iconColor: '#15803D', endpoint: '/api/convert/excel-to-pdf', accept: { 'application/vnd.ms-excel': ['.xls'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } },
      { id: 'markdown-to-pdf', label: 'Markdown to PDF', desc: 'Convert .md notes and docs to formatted PDF', icon: <FileCode size={16} />, iconColor: '#0F766E', endpoint: '/api/convert/markdown-to-pdf', accept: { 'text/markdown': ['.md', '.markdown'], 'text/plain': ['.txt'] } },
    ],
  },
  {
    id: 'convert-from',
    label: 'Convert from PDF',
    emoji: <Repeat size={24} />,
    color: 'from-teal-500 to-green-600',
    tools: [
      { id: 'pdf-to-word', label: 'PDF to Word', desc: 'Convert PDF to editable .docx document', icon: <FileText size={16} />, iconColor: '#059669', endpoint: '/api/convert/pdf-to-word', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'pdf-to-excel', label: 'PDF to Excel', desc: 'Extract PDF data and tables to .xlsx spreadsheet', icon: <Table size={16} />, iconColor: '#10B981', endpoint: '/api/convert/pdf-to-excel', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'pdf-to-csv', label: 'PDF to CSV', desc: 'Export PDF tables and line items to .csv', icon: <Table size={16} />, iconColor: '#047857', endpoint: '/api/convert/pdf-to-csv', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'pdf-to-jpg', label: 'PDF to JPG', desc: 'Export PDF pages as high-DPI JPG images', icon: <ImageIcon size={16} />, iconColor: '#0891B2', endpoint: '/api/convert/pdf-to-jpg', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'pdf-to-png', label: 'PDF to PNG', desc: 'Export PDF pages as crisp transparent PNG images', icon: <ImageDown size={16} />, iconColor: '#0E7490', endpoint: '/api/convert/pdf-to-png', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'pdf-to-text', label: 'PDF to Text', desc: 'Extract full text from PDF into .txt', icon: <FileText size={16} />, iconColor: '#065F46', endpoint: '/api/convert/pdf-to-text', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'pdf-to-html', label: 'PDF to HTML', desc: 'Convert PDF document to formatted web HTML', icon: <FileCode size={16} />, iconColor: '#0F766E', endpoint: '/api/convert/pdf-to-html', accept: { 'application/pdf': ['.pdf'] } },
    ],
  },
  {
    id: 'convert-word',
    label: 'Word & Document Tools',
    emoji: <FileText size={24} />,
    color: 'from-sky-500 to-blue-600',
    tools: [
      { id: 'word-to-text', label: 'Word to Text', desc: 'Extract clean plain text from Word (.docx)', icon: <FileText size={16} />, iconColor: '#3B82F6', endpoint: '/api/convert/word-to-text', accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] } },
      { id: 'word-to-html', label: 'Word to HTML', desc: 'Convert Word documents to clean web HTML', icon: <FileCode size={16} />, iconColor: '#2563EB', endpoint: '/api/convert/word-to-html', accept: { 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/msword': ['.doc'] } },
      { id: 'text-to-word', label: 'Text to Word', desc: 'Convert plain text (.txt) into formatted .docx Word file', icon: <FileText size={16} />, iconColor: '#1D4ED8', endpoint: '/api/convert/text-to-word', accept: { 'text/plain': ['.txt'] } },
    ],
  },
  {
    id: 'convert-images',
    label: 'Image Converter & OCR',
    emoji: <ImageIcon size={24} />,
    color: 'from-emerald-500 to-teal-600',
    tools: [
      { id: 'jpg-to-png', label: 'JPG to PNG', desc: 'Convert JPG/JPEG images to PNG with transparency', icon: <ImageIcon size={16} />, iconColor: '#0891B2', endpoint: '/api/convert/jpg-to-png', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } },
      { id: 'png-to-jpg', label: 'PNG to JPG', desc: 'Convert PNG to high-quality JPG image', icon: <ImageDown size={16} />, iconColor: '#0E7490', endpoint: '/api/convert/png-to-jpg', accept: { 'image/png': ['.png'] } },
      { id: 'image-to-webp', label: 'Image to WebP', desc: 'Convert images to high-compression WebP format', icon: <Layers size={16} />, iconColor: '#0369A1', endpoint: '/api/convert/image-to-webp', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.bmp', '.tiff'] } },
      { id: 'webp-to-jpg', label: 'WebP to JPG', desc: 'Convert WebP images to standard JPG format', icon: <ImageIcon size={16} />, iconColor: '#155E75', endpoint: '/api/convert/webp-to-jpg', accept: { 'image/webp': ['.webp'] } },
      { id: 'webp-to-png', label: 'WebP to PNG', desc: 'Convert WebP images to lossless PNG format', icon: <ImageDown size={16} />, iconColor: '#164E63', endpoint: '/api/convert/webp-to-png', accept: { 'image/webp': ['.webp'] } },
      { id: 'image-to-text', label: 'Image to Text (OCR)', desc: 'Extract recognized text from photos and scans', icon: <Wand2 size={16} />, iconColor: '#6D28D9', endpoint: '/api/convert/image-to-text', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'] } },
    ],
  },
  {
    id: 'edit',
    label: 'Edit PDF',
    emoji: <PenTool size={24} />,
    color: 'from-pink-500 to-rose-600',
    tools: [
      { id: 'sign-pdf', label: 'Sign PDF', desc: 'Sign every page — typed or image signature', icon: <PenTool size={16} />, iconColor: '#DB2777', endpoint: '/api/pdf/sign', accept: { 'application/pdf': ['.pdf'] }, hasSignatureUpload: true, showsPageCount: true },
      { id: 'add-text', label: 'Type on PDF', desc: 'Multi-line text on all or selected pages', icon: <Type size={16} />, iconColor: '#EC4899', endpoint: '/api/pdf/add-text', accept: { 'application/pdf': ['.pdf'] }, showsPageCount: true },
      { id: 'highlight', label: 'Highlight PDF', desc: 'Highlight regions on all or selected pages', icon: <Highlighter size={16} />, iconColor: '#F59E0B', endpoint: '/api/pdf/highlight', accept: { 'application/pdf': ['.pdf'] }, showsPageCount: true },
      { id: 'rotate', label: 'Rotate PDF', desc: 'Rotate all or specific pages', icon: <RotateCw size={16} />, iconColor: '#BE185D', endpoint: '/api/pdf/rotate', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'watermark', label: 'Add Watermark', desc: 'Diagonal or tiled watermark on all pages', icon: <Droplet size={16} />, iconColor: '#9D174D', endpoint: '/api/pdf/watermark', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'page-numbers', label: 'Page Numbers', desc: 'Custom formats: Page X of Y', icon: <Hash size={16} />, iconColor: '#BE185D', endpoint: '/api/pdf/page-numbers', accept: { 'application/pdf': ['.pdf'] } },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    emoji: <Lock size={24} />,
    color: 'from-red-500 to-rose-700',
    tools: [
      { id: 'protect', label: 'Protect PDF', desc: 'Password & permission lock', icon: <Lock size={16} />, iconColor: '#DC2626', endpoint: '/api/pdf/protect', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'unlock', label: 'Unlock PDF', desc: 'Remove PDF password protection', icon: <Unlock size={16} />, iconColor: '#16A34A', endpoint: '/api/pdf/unlock', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'sanitize', label: 'Sanitize Metadata', desc: 'Wipe author, creator, software & EXIF tracking tags', icon: <Wand2 size={16} />, iconColor: '#B91C1C', endpoint: '/api/pdf/sanitize', accept: { 'application/pdf': ['.pdf'] } },
    ],
  },
  {
    id: 'ai',
    label: 'AI Features',
    emoji: <Brain size={24} />,
    color: 'from-indigo-500 to-violet-700',
    tools: [
      { id: 'ocr', label: 'OCR PDF', desc: 'Extract text from scans (multi-language)', icon: <Eye size={16} />, iconColor: '#4F46E5', endpoint: '/api/ai/ocr', accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.tiff'], 'application/pdf': ['.pdf'] } },
      { id: 'summarize', label: 'Summarize PDF', desc: 'AI extractive summarization', icon: <Bot size={16} />, iconColor: '#4338CA', endpoint: '/api/ai/summarize', accept: { 'application/pdf': ['.pdf'] } },
      { id: 'word-count', label: 'PDF Word Counter', desc: 'Detailed word count, reading time & stats', icon: <Sparkles size={16} />, iconColor: '#6366F1', endpoint: '/api/pdf/word-count', accept: { 'application/pdf': ['.pdf'] } },
    ],
  },
];

export const ALL_TOOLS = TOOL_CATEGORIES.flatMap((cat) =>
  cat.tools.map((tool) => ({ ...tool, category: cat.label, categoryId: cat.id, categoryColor: cat.color }))
);

export const getToolById = (id) => ALL_TOOLS.find((t) => t.id === id);

// Tool-specific options/fields
export const TOOL_OPTIONS = {
  merge: [
    { id: 'title', label: 'PDF title (optional)', type: 'text', placeholder: 'e.g. Project Report 2025', required: false },
    { id: 'author', label: 'Author name (optional)', type: 'text', placeholder: 'e.g. Jane Smith', required: false },
  ],
  split: [
    { id: 'ranges', label: 'Page ranges', type: 'text', placeholder: 'e.g. 1-3,4-6 (empty = each page separate)', required: false },
    { id: 'splitMode', label: 'Mode', type: 'select', options: [
      { value: 'ranges', label: 'By ranges' },
      { value: 'every', label: 'Every page as file' },
    ], default: 'ranges' },
  ],
  'remove-pages': [
    { id: 'pages', label: 'Pages to remove', type: 'text', placeholder: 'e.g. 1,3,5-7', required: true },
  ],
  'extract-pages': [
    { id: 'pages', label: 'Pages to extract', type: 'text', placeholder: 'e.g. 1,3,5-7', required: true },
  ],
  organize: [
    { id: 'order', label: 'New page order', type: 'text', placeholder: 'e.g. 3,1,2,4', required: true },
  ],
  compress: [
    {
      id: 'quality', label: 'Compression preset', type: 'select', required: false,
      options: [
        { value: 'screen', label: 'Maximum compression (72 DPI)' },
        { value: 'ebook', label: 'Balanced (150 DPI)' },
        { value: 'printer', label: 'High quality (300 DPI)' },
        { value: 'prepress', label: 'Maximum quality (prepress)' },
      ],
      default: 'screen',
    },
  ],
  rotate: [
    {
      id: 'rotation', label: 'Rotation', type: 'select', required: false,
      options: [
        { value: '90', label: '90° clockwise' },
        { value: '180', label: '180°' },
        { value: '270', label: '270° (counter-clockwise)' },
      ],
      default: '90',
    },
    PAGE_SCOPE_FIELD,
    CUSTOM_PAGES_FIELD,
  ],
  'add-text': [
    { id: 'text', label: 'Text (use \\n for new lines)', type: 'textarea', placeholder: 'Approved by Jane Doe\\nDepartment Head', required: true },
    PAGE_SCOPE_FIELD,
    CUSTOM_PAGES_FIELD,
    {
      id: 'alignment', label: 'Alignment', type: 'select', options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
      default: 'left',
    },
    { id: 'x', label: 'X (from left)', type: 'text', placeholder: '72', default: '72' },
    { id: 'y', label: 'Y (from bottom)', type: 'text', placeholder: '72', default: '72' },
    { id: 'fontSize', label: 'Font size', type: 'text', default: '14' },
    { id: 'lineHeight', label: 'Line spacing', type: 'text', default: '1.35' },
    { id: 'opacity', label: 'Opacity (0.1–1)', type: 'text', default: '1' },
    {
      id: 'font', label: 'Font', type: 'select', options: [
        { value: 'helvetica', label: 'Helvetica' },
        { value: 'helveticaBold', label: 'Helvetica Bold' },
        { value: 'times', label: 'Times Roman' },
        { value: 'italic', label: 'Times Italic' },
        { value: 'courier', label: 'Courier' },
      ],
      default: 'helvetica',
    },
    { id: 'color', label: 'Text color', type: 'color', default: '#000000' },
  ],
  'sign-pdf': [
    {
      id: 'signType', label: 'Signature type', type: 'select',
      options: [
        { value: 'text', label: 'Typed signature' },
        { value: 'image', label: 'Image signature (PNG/JPG)' },
      ],
      default: 'text',
    },
    PAGE_SCOPE_FIELD,
    CUSTOM_PAGES_FIELD,
    { id: 'signatureText', label: 'Your signature', type: 'text', placeholder: 'John Smith', default: 'Signed', showWhen: { signType: 'text' } },
    { id: 'signerTitle', label: 'Title / role (optional)', type: 'text', placeholder: 'e.g. Director', showWhen: { signType: 'text' } },
    { id: 'fontSize', label: 'Signature size', type: 'text', default: '28', showWhen: { signType: 'text' } },
    { id: 'signColor', label: 'Ink color', type: 'color', default: '#1a1a66', showWhen: { signType: 'text' } },
    { id: 'signScale', label: 'Image scale (0.05–1)', type: 'text', default: '0.25', showWhen: { signType: 'image' } },
    { id: 'signOpacity', label: 'Image opacity', type: 'text', default: '1', showWhen: { signType: 'image' } },
    {
      id: 'position', label: 'Position on each page', type: 'select',
      options: [
        { value: 'bottom-right', label: 'Bottom right' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-center', label: 'Bottom center' },
        { value: 'top-right', label: 'Top right' },
        { value: 'top-left', label: 'Top left' },
        { value: 'top-center', label: 'Top center' },
        { value: 'center', label: 'Center' },
      ],
      default: 'bottom-right',
    },
    { id: 'offsetX', label: 'Fine-tune X offset', type: 'text', default: '0' },
    { id: 'offsetY', label: 'Fine-tune Y offset', type: 'text', default: '0' },
    { id: 'includeDate', label: 'Add date under signature', type: 'toggle', default: 'true' },
    { id: 'dateLabel', label: 'Custom date text', type: 'text', placeholder: 'Leave empty for today' },
    { id: 'includeReason', label: 'Add reason line', type: 'toggle', default: 'false' },
    { id: 'reason', label: 'Reason text', type: 'text', placeholder: 'e.g. Approved', showWhen: { includeReason: 'true' } },
  ],
  highlight: [
    PAGE_SCOPE_FIELD,
    CUSTOM_PAGES_FIELD,
    { id: 'x', label: 'X (from left)', type: 'text', default: '72' },
    { id: 'y', label: 'Y (from bottom)', type: 'text', default: '600' },
    { id: 'width', label: 'Width', type: 'text', default: '200' },
    { id: 'height', label: 'Height', type: 'text', default: '24' },
    { id: 'color', label: 'Highlight color', type: 'color', default: '#ffff00' },
    { id: 'opacity', label: 'Opacity', type: 'text', default: '0.35' },
  ],
  watermark: [
    { id: 'text', label: 'Watermark text', type: 'text', default: 'CONFIDENTIAL', required: true },
    PAGE_SCOPE_FIELD,
    CUSTOM_PAGES_FIELD,
    { id: 'opacity', label: 'Opacity', type: 'text', default: '0.3' },
    { id: 'fontSize', label: 'Font size', type: 'text', default: '60' },
    { id: 'angle', label: 'Angle (degrees)', type: 'text', default: '45' },
    { id: 'tileMode', label: 'Tile across page', type: 'toggle', default: 'false' },
  ],
  'page-numbers': [
    {
      id: 'format', label: 'Number format', type: 'select',
      options: [
        { value: 'number', label: '1, 2, 3…' },
        { value: 'pageOf', label: 'Page 1 of 10' },
        { value: 'custom', label: 'Custom prefix/suffix' },
      ],
      default: 'pageOf',
    },
    { id: 'prefix', label: 'Prefix', type: 'text', placeholder: 'P-', showWhen: { format: 'custom' } },
    { id: 'suffix', label: 'Suffix', type: 'text', placeholder: '-DRAFT', showWhen: { format: 'custom' } },
    {
      id: 'position', label: 'Position', type: 'select',
      options: [
        { value: 'bottom-center', label: 'Bottom center' },
        { value: 'bottom-left', label: 'Bottom left' },
        { value: 'bottom-right', label: 'Bottom right' },
      ],
      default: 'bottom-center',
    },
    { id: 'startFrom', label: 'Start number', type: 'text', default: '1' },
    { id: 'fontSize', label: 'Font size', type: 'text', default: '12' },
  ],
  protect: [
    { id: 'userPassword', label: 'Password', type: 'password', required: true },
    { id: 'ownerPassword', label: 'Owner password (optional)', type: 'password' },
  ],
  unlock: [
    { id: 'password', label: 'Current password', type: 'password' },
  ],
  'jpg-to-pdf': [
    {
      id: 'fitToPage', label: 'Page sizing', type: 'select', required: false,
      options: [
        { value: 'false', label: 'Original image size (no scaling)' },
        { value: 'true', label: 'Fit to A4 page (recommended)' },
      ],
      default: 'false',
    },
  ],
  'pdf-to-jpg': [
    {
      id: 'dpi', label: 'Export DPI', type: 'select',
      options: [
        { value: '72', label: '72 — web' },
        { value: '150', label: '150 — balanced' },
        { value: '300', label: '300 — print' },
      ],
      default: '150',
    },
  ],

  ocr: [
    {
      id: 'lang', label: 'Language', type: 'select',
      options: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
      ],
      default: 'eng',
    },
  ],
  summarize: [
    {
      id: 'maxSentences', label: 'Summary length', type: 'select',
      options: [
        { value: '3', label: '3 sentences' },
        { value: '5', label: '5 sentences' },
        { value: '8', label: '8 sentences' },
        { value: '12', label: '12 sentences' },
      ],
      default: '5',
    },
  ],
  'png-to-jpg': [
    {
      id: 'quality', label: 'JPEG Quality', type: 'select',
      options: [
        { value: '100', label: '100% — Maximum Quality' },
        { value: '92', label: '92% — High Quality (Recommended)' },
        { value: '80', label: '80% — Balanced Size' },
        { value: '65', label: '65% — Compact' },
      ],
      default: '92',
    },
  ],
  'image-to-webp': [
    {
      id: 'quality', label: 'WebP Compression', type: 'select',
      options: [
        { value: '95', label: '95% — Ultra Crisp' },
        { value: '85', label: '85% — Optimal (Recommended)' },
        { value: '75', label: '75% — Lightweight' },
      ],
      default: '85',
    },
  ],
  'pdf-to-png': [
    {
      id: 'dpi', label: 'Export DPI', type: 'select',
      options: [
        { value: '72', label: '72 — web' },
        { value: '150', label: '150 — balanced (Recommended)' },
        { value: '300', label: '300 — high-resolution print' },
      ],
      default: '150',
    },
  ],
  'webp-to-jpg': [
    {
      id: 'quality', label: 'JPEG Quality', type: 'select',
      options: [
        { value: '100', label: '100% — Maximum Quality' },
        { value: '92', label: '92% — High Quality (Recommended)' },
        { value: '80', label: '80% — Balanced Size' },
      ],
      default: '92',
    },
  ],
  'image-to-text': [
    {
      id: 'language', label: 'OCR Recognition Language', type: 'select',
      options: [
        { value: 'eng', label: 'English' },
        { value: 'fra', label: 'French' },
        { value: 'deu', label: 'German' },
        { value: 'spa', label: 'Spanish' },
        { value: 'ita', label: 'Italian' },
        { value: 'por', label: 'Portuguese' },
        { value: 'chi_sim', label: 'Chinese (Simplified)' },
        { value: 'jpn', label: 'Japanese' },
      ],
      default: 'eng',
    },
  ],
};

/** Whether an option field should show based on current option values */
export function isOptionVisible(opt, options) {
  if (!opt.showWhen) return true;
  return Object.entries(opt.showWhen).every(([key, val]) => options[key] === val);
}
