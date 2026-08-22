# PdfFlow — Free Online PDF Tools (Open Source)

**PdfFlow** is a complete, premium, open-source PDF toolkit. This web application provides a full suite of PDF editing, conversion, compression, organization, and AI summarization features under a modern interface with dark/light theme support.

## 🚀 Key Features

*   **📂 Organize PDF**: Merge multiple PDFs, split ranges, extract/remove specific pages, and reorder pages by visual drag and drop.
*   **⚡ Optimize PDF**: Compress PDFs to reduce file size, or repair corrupted PDF files.
*   **🔄 Convert to PDF**: Convert JPG, Word (`.docx`), PowerPoint (`.pptx`), and Excel (`.xlsx`) documents seamlessly.
*   **🔁 Convert from PDF**: Convert PDF to JPG images, raw Text, or basic editable Word (`.docx`) files.
*   **✏️ Edit PDF**: Apply multi-page text watermarks, rotate pages, and insert dynamic page numbering.
*   **🔐 Security**: Add password protection to PDF files or remove protection from secured PDFs.
*   **🧠 AI Tools**: Extract text from scanned pages using local OCR (Tesseract.js) and generate high-quality extractive summaries using Compromise NLP.
*   **📁 Local History**: Access your processed file history safely. Stored locally inside your browser for full privacy, with option to register and save to database.

---

## 🛠️ Technology Stack

### Frontend
- **React 19 / Next.js 16 (App Router)**
- **Tailwind CSS v4** (Utility styling & theme mapping)
- **Framer Motion** (Fluid micro-interactions & entry animations)
- **Dropzone & Dnd-kit** (Drag-and-drop file operations and page re-ordering)
- **React Hot Toast** (Clean error/success notifications)

### Backend
- **Node.js & Express**
- **Multer** (File upload handling)
- **PDF-lib** (High-fidelity PDF generation, splitting, rotating, watermarking, protecting, and unlocking)
- **Sharp** (Super-fast image resizing & optimization)
- **pdf-parse & docx** (Text extraction & docx generation)
- **Tesseract.js** (Optical Character Recognition)
- **Compromise** (Extractive natural language processing for summarization)
- **Node-cron** (Scheduled automatic uploads clean-ups every 1 hour)

---

## 💻 Prerequisites & Setup

To use the full capabilities (like converting MS Office documents), the server requires access to external command-line utilities. If not present, the server degrades gracefully and prints fallbacks.

### 1. Install External Dependencies (Server)

-   **Ghostscript** (Used for high-efficiency PDF compression)
    -   *Windows*: Install from [Ghostscript Releases](https://www.ghostscript.com/download/gshld.html). Add `gswin64c` to your System PATH variables or configure `GHOSTSCRIPT_PATH` in `.env`.
    -   *macOS*: `brew install ghostscript`
    -   *Linux*: `sudo apt-get install ghostscript`
-   **LibreOffice** (Used for Word, PPT, Excel to PDF conversions)
    -   *Windows*: Install from [LibreOffice Website](https://www.libreoffice.org/). Ensure the directory `C:\Program Files\LibreOffice\program\` containing `soffice.exe` is in your System PATH or configure `LIBREOFFICE_PATH` in `.env`.
    -   *macOS*: `brew install --cask libreoffice`
    -   *Linux*: `sudo apt-get install libreoffice`

### 2. Configure Environment Variables

Create a `.env` file in the `/server` directory (you can copy `.env.example` as a template):
```env
PORT=5000
CLIENT_URL=http://localhost:3000
JWT_SECRET=super_secret_jwt_passphrase_1234
MONGO_URI=mongodb+srv://...  # Optional. If omitted, file history will run purely in local storage
```

### 3. Run the Backend Server
```bash
cd server
npm install
node index.js
```

### 4. Run the app (both servers required)

**Easiest (Windows):** double-click `start.bat` in the project root, or run:

```powershell
.\start.ps1
```

**Or from the project root** (after `npm install` once in `server`, `client`, and root):

```bash
npm install
cd server && npm install && cd ../client && npm install && cd ..
npm run dev
```

**Manual (two terminals):**

```bash
# Terminal 1 — API (required for PDF tools)
cd server
node index.js

# Terminal 2 — website
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If tools fail, check that the API is running on [http://localhost:5000/api/health](http://localhost:5000/api/health).
