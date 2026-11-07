# SCANDOC // Smart Document Workstation, QR Studio & PDF Suite

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.4.4-1e3d59?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-ff6e40?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-1e3d59?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-ff6e40?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-ffc13b?style=for-the-badge&logoColor=1e3d59)

<br />

**ScanDoc is a privacy-first, industrial Swiss-utility web workstation for extracting structured data from documents into QR codes, generating custom branded matrices, and converting, organizing, watermarking, and signing documents — entirely in the browser.**

[Live Demo](https://github.com/NitinChamp1/QR_generator) • [Report Issue](https://github.com/NitinChamp1/QR_generator/issues)

</div>

---

## ⚡ Key Highlights

- **🔒 100% In-Browser Execution**: Zero uploads to external servers. All OCR, PDF parsing, Word document generation, image conversions, and signature stamping run entirely in client-side WebAssembly, Canvas, and JavaScript.
- **⚡ Zero Latency & Infinite Privacy**: Works completely client-side without API rate limits, tracking, or backend infrastructure costs.
- **📐 TAKO Swiss Utility Aesthetic**: Tactile mechanical aesthetic with an intentional 4-color palette: Deep Slate Navy (`#1e3d59`), Warm Almond Cream (`#f5f0e1`), Coral Tangerine (`#ff6e40`), and Marigold Gold (`#ffc13b`).

---

## 🛠️ Modules & Capabilities

### [1] Document & Image Field Extractor → QR Bridge
* **Client-Side OCR**: Powered by Tesseract.js running in a local browser worker.
* **Smart Attribute Heuristics**: Automatically detects and tags structured data:
  * Full Names, Job Titles, and Company Organizations
  * Phone numbers (`TEL`), Email addresses (`EMAIL`), and URLs (`WEB`)
  * Physical postal addresses (`ADDR`)
  * Invoice totals, receipt numbers, and transaction dates
* **Interactive Field Editor**: Toggle, edit, add, or delete individual keys and values in real time.
* **1-Click QR Bridge**: Encodes extracted data directly into standard vCard (`.vcf`), JSON, URL, or plain text formats and bridges into the matrix generator.

---

### [2] Advanced QR Studio
* **7 Supported Data Encodings**:
  * 🌐 **URL Links**: Direct website redirection
  * 👤 **vCard Contacts**: Full contact cards with name, phone, email, organization, website, and address
  * 📶 **Wi-Fi Credentials**: Auto-join Wi-Fi configurations (WPA/WPA2/WPA3, WEP, Open)
  * 📝 **Plain Text**: Unformatted notes and identifiers
  * ✉️ **Email**: Pre-filled recipient, subject line, and body text
  * 💬 **SMS**: Targeted phone number and predefined message
  * 💻 **JSON Data**: Raw structured payloads for technical integrations
* **Visual Customizer**:
  * Precision pattern and background color pickers with preset utility swatches
  * Center brand logo embedding with dynamic sizing and automatic background excavation
  * Error correction levels: **L** (7%), **M** (15%), **Q** (25%), **H** (30% recovery for logo embedding)
  * Safe margin switch (ISO/IEC 18004 compliance)
* **Multi-Format Export**:
  * 🎨 **Vector SVG**: Infinitely scalable vector graphics for print and signage
  * 🖼️ **High-DPI PNG**: 1024×1024 crisp bitmap exports
  * 📋 **Direct Clipboard Copy**: Copy QR bitmap straight to clipboard
  * 🖨️ **Print Target**: Native browser print mode

---

### [3] Universal Format Converter
* **Image Converter**:
  * Batch convert between `PNG`, `JPEG`, `WEBP`, `BMP`, and `ICO` (Favicons)
  * Dynamic quality compression slider for lossy formats
  * Single file downloads or bulk ZIP export
* **PDF to Word (.docx)**:
  * Extracts paragraph structures, headings, and lines from multi-page PDFs using PDF.js
  * Generates clean `.docx` Word documents client-side using `docx.js`
* **PDF to Images**:
  * Renders every page of a PDF document at 2.0× high-density resolution to PNG or JPEG
  * Download pages individually or download all pages bundled in a `.zip` archive
* **Images to PDF**:
  * Combine multiple photos, scans, or receipts into a single formatted PDF
  * Reorder pages with tactile `Up` / `Down` controls
  * Instant download using `pdf-lib`

---

## 🏗️ Architecture & Tech Stack

```
QR_generator/
├── src/
│   ├── app/
│   │   ├── globals.css         # Pure CSS TAKO industrial design system
│   │   ├── layout.tsx          # Root layout & typography
│   │   └── page.tsx            # Workbench shell & tab coordinator
│   ├── components/
│   │   ├── Navbar.tsx          # Mechanical segmented navigation
│   │   ├── ImageFieldExtractor.tsx # OCR & attribute classifier
│   │   ├── QRStudio.tsx        # High-DPI QR generation engine
│   │   └── FormatConverter.tsx # 4-in-1 format conversion workbench
│   ├── types/
│   │   └── index.ts            # Core TypeScript interfaces & unions
│   └── utils/
│       ├── ocr.ts              # Tesseract.js pipeline & regex parsers
│       ├── qrPayloads.ts       # vCard, Wi-Fi, and JSON formatters
│       ├── imageConverter.ts   # Canvas image rasterizer & MIME mapper
│       └── pdfConverter.ts     # PDF.js + docx + pdf-lib compilation
```

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (Turbopack, App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 + Pure Swiss Industrial CSS |
| **Icons** | Lucide React |
| **OCR Engine** | Tesseract.js (Client-side WebWorker) |
| **QR Engine** | qrcode.react (Canvas + SVG) |
| **Document Processing** | pdfjs-dist, pdf-lib, docx, jszip, file-saver |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18+ or 20+
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/NitinChamp1/QR_generator.git
   cd QR_generator
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch local development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deployment

This project is built for zero-config deployment on **Vercel**:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNitinChamp1%2FQR_generator)

1. Import the repository on [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js**.
3. No environment variables required (all processing is 100% in-browser).
4. Click **Deploy**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
