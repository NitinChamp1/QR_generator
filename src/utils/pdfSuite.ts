import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Ensure PDF.js worker is initialized
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

/**
 * Merge multiple PDF files into a single unified PDF
 */
export async function mergePdfs(
  files: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; url: string; pageCount: number }> {
  const mergedPdf = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    onProgress?.(i + 1, files.length);
    const file = files[i];
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedBytes = await mergedPdf.save();
  const blob = new Blob([mergedBytes as BlobPart], { type: 'application/pdf' });
  return {
    blob,
    url: URL.createObjectURL(blob),
    pageCount: mergedPdf.getPageCount(),
  };
}

/**
 * Parse page range strings like "1-3, 5, 7-10" or "all" into zero-based indices
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  if (!rangeStr.trim() || rangeStr.toLowerCase() === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const indices = new Set<number>();
  const parts = rangeStr.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map((s) => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(totalPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Split a PDF into one or more target PDFs
 */
export async function splitPdf(
  file: File,
  mode: 'all_pages' | 'ranges',
  rangeStr = ''
): Promise<Array<{ fileName: string; blob: Blob; url: string; pageCount: number }>> {
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const results: Array<{ fileName: string; blob: Blob; url: string; pageCount: number }> = [];

  if (mode === 'all_pages') {
    // Extract every single page into its own individual PDF
    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copiedPage);

      const outBytes = await singleDoc.save();
      const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
      results.push({
        fileName: `${baseName}_page_${i + 1}.pdf`,
        blob,
        url: URL.createObjectURL(blob),
        pageCount: 1,
      });
    }
  } else {
    // Extract specified ranges
    const targetIndices = parsePageRangeString(rangeStr, totalPages);
    if (targetIndices.length === 0) {
      throw new Error('No valid pages found in specified page range.');
    }

    const rangeDoc = await PDFDocument.create();
    const copiedPages = await rangeDoc.copyPages(srcDoc, targetIndices);
    copiedPages.forEach((p) => rangeDoc.addPage(p));

    const outBytes = await rangeDoc.save();
    const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
    results.push({
      fileName: `${baseName}_extracted.pdf`,
      blob,
      url: URL.createObjectURL(blob),
      pageCount: targetIndices.length,
    });
  }

  return results;
}

/**
 * Rotate PDF pages by 90, 180, or 270 degrees
 */
export async function rotatePdf(
  file: File,
  rotationDelta: number,
  pageIndicesToRotate?: number[]
): Promise<{ blob: Blob; url: string }> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, idx) => {
    if (!pageIndicesToRotate || pageIndicesToRotate.includes(idx)) {
      const currentRotation = page.getRotation().angle;
      const newRotation = (currentRotation + rotationDelta) % 360;
      page.setRotation(degrees(newRotation));
    }
  });

  const outBytes = await pdfDoc.save();
  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  return { blob, url: URL.createObjectURL(blob) };
}

/**
 * Reorder or delete pages visually from a PDF
 */
export async function reorderAndFilterPdf(
  file: File,
  newPageOrder: number[] // array of original zero-based page indices
): Promise<{ blob: Blob; url: string }> {
  const bytes = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const copiedPages = await newDoc.copyPages(srcDoc, newPageOrder);
  copiedPages.forEach((p) => newDoc.addPage(p));

  const outBytes = await newDoc.save();
  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  return { blob, url: URL.createObjectURL(blob) };
}

/**
 * Add a diagonal watermark across all pages
 */
export async function addWatermarkToPdf(
  file: File,
  watermarkText: string,
  opacity = 0.25,
  colorHex = '#ff6e40'
): Promise<{ blob: Blob; url: string }> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedStandardFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  // Parse color hex
  const r = parseInt(colorHex.slice(1, 3), 16) / 255 || 1;
  const g = parseInt(colorHex.slice(3, 5), 16) / 255 || 0.33;
  const b = parseInt(colorHex.slice(5, 7), 16) / 255 || 0;

  pages.forEach((page) => {
    const { width, height } = page.getSize();
    const textSize = Math.min(width, height) / 10;
    const textWidth = font.widthOfTextAtSize(watermarkText, textSize);
    const textHeight = font.heightAtSize(textSize);

    page.drawText(watermarkText, {
      x: width / 2 - textWidth / 2 + 30,
      y: height / 2 - textHeight / 2,
      size: textSize,
      font,
      color: rgb(r, g, b),
      rotate: degrees(45),
      opacity: Math.max(0.05, Math.min(1.0, opacity)),
    });
  });

  const outBytes = await pdfDoc.save();
  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  return { blob, url: URL.createObjectURL(blob) };
}

/**
 * Add page numbering to a PDF
 */
export async function addPageNumbersToPdf(
  file: File,
  format: 'page_of_total' | 'simple' | 'brackets' = 'page_of_total',
  position: 'bottom_center' | 'bottom_right' | 'top_right' = 'bottom_center'
): Promise<{ blob: Blob; url: string }> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const { width, height } = page.getSize();
    let text = `Page ${idx + 1} of ${total}`;
    if (format === 'simple') text = `${idx + 1} / ${total}`;
    if (format === 'brackets') text = `[ ${idx + 1} ]`;

    const textSize = 10;
    const textWidth = font.widthOfTextAtSize(text, textSize);

    let x = width / 2 - textWidth / 2;
    let y = 25;

    if (position === 'bottom_right') {
      x = width - textWidth - 35;
      y = 25;
    } else if (position === 'top_right') {
      x = width - textWidth - 35;
      y = height - 30;
    }

    page.drawText(text, {
      x,
      y,
      size: textSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  });

  const outBytes = await pdfDoc.save();
  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  return { blob, url: URL.createObjectURL(blob) };
}

/**
 * Stamp a drawn signature onto a specific page of a PDF
 */
export async function stampSignatureOnPdf(
  file: File,
  signaturePngBlob: Blob,
  targetPageNumber: number, // 1-based
  position: { x: number; y: number; width?: number; height?: number }
): Promise<{ blob: Blob; url: string }> {
  const bytes = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const sigBytes = new Uint8Array(await signaturePngBlob.arrayBuffer());
  const sigImage = await pdfDoc.embedPng(sigBytes);

  const pages = pdfDoc.getPages();
  const pageIdx = Math.max(0, Math.min(pages.length - 1, targetPageNumber - 1));
  const page = pages[pageIdx];

  const sigWidth = position.width || 150;
  const sigHeight = position.height || 60;

  page.drawImage(sigImage, {
    x: position.x,
    y: position.y,
    width: sigWidth,
    height: sigHeight,
  });

  const outBytes = await pdfDoc.save();
  const blob = new Blob([outBytes as BlobPart], { type: 'application/pdf' });
  return { blob, url: URL.createObjectURL(blob) };
}

/**
 * Extract clean, structured Markdown from a PDF using PDF.js
 */
export async function convertPdfToMarkdown(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  let markdown = `# ${file.name.replace(/\.[^/.]+$/, '')}\n\n`;

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as Array<{ str?: string; hasEOL?: boolean; height?: number }>;

    if (numPages > 1) {
      markdown += `\n---\n\n## Page ${i}\n\n`;
    }

    let currentLine = '';
    for (const item of items) {
      if (item.str !== undefined) {
        currentLine += item.str + ' ';
      }
      if (item.hasEOL) {
        const trimmed = currentLine.trim();
        if (trimmed.length > 0) {
          // Check if looks like a sub-heading (all caps or short bold)
          if (trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /^[A-Z0-9\s:/-]+$/.test(trimmed)) {
            markdown += `### ${trimmed}\n\n`;
          } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
            markdown += `* ${trimmed.replace(/^[•-]\s*/, '')}\n`;
          } else {
            markdown += `${trimmed}\n\n`;
          }
          currentLine = '';
        }
      }
    }

    if (currentLine.trim().length > 0) {
      markdown += `${currentLine.trim()}\n\n`;
    }
  }

  return markdown.trim();
}
