'use client';

import { PDFDocument } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

let pdfjsLib: any = null;

async function getPdfJs() {
  if (typeof window === 'undefined') return null;
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Set worker to unpkg CDN for guaranteed browser compatibility without server bundling issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
  }
  return pdfjsLib;
}

export interface PDFPageImage {
  pageNumber: number;
  blob: Blob;
  url: string;
  width: number;
  height: number;
}

/**
 * Render all pages of a PDF into high-res images (PNG or JPEG)
 */
export async function convertPdfToImages(
  pdfFile: File,
  format: 'image/png' | 'image/jpeg' = 'image/png',
  scale: number = 2.0,
  onProgress?: (current: number, total: number) => void
): Promise<PDFPageImage[]> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js is only available in browser');

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const results: PDFPageImage[] = [];

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) continue;

    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({
      canvasContext: ctx,
      viewport: viewport,
    }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, format, 0.95)
    );

    if (blob) {
      results.push({
        pageNumber: i,
        blob,
        url: URL.createObjectURL(blob),
        width: viewport.width,
        height: viewport.height,
      });
    }
  }

  return results;
}

/**
 * Extract structured text from PDF and compile into a Microsoft Word (.docx) document
 */
export async function convertPdfToDocx(
  pdfFile: File,
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; url: string; extractedText: string }> {
  const pdfjs = await getPdfJs();
  if (!pdfjs) throw new Error('PDF.js is only available in browser');

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  const docParagraphs: Paragraph[] = [
    new Paragraph({
      text: pdfFile.name.replace(/\.[^/.]+$/, ''),
      heading: HeadingLevel.TITLE,
      spacing: { after: 240 },
    }),
  ];

  let fullExtractedText = '';

  for (let i = 1; i <= numPages; i++) {
    onProgress?.(i, numPages);
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();

    let pageText = '';
    const items = textContent.items as Array<{ str?: string; hasEOL?: boolean }>;

    // Add page separator header if multiple pages
    if (numPages > 1) {
      docParagraphs.push(
        new Paragraph({
          text: `--- Page ${i} ---`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        })
      );
    }

    let currentParagraphText = '';

    for (const item of items) {
      if (item.str !== undefined) {
        currentParagraphText += item.str + ' ';
        pageText += item.str + (item.hasEOL ? '\n' : ' ');
      }
      if (item.hasEOL) {
        if (currentParagraphText.trim().length > 0) {
          docParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: currentParagraphText.trim(),
                  size: 24, // 12pt
                }),
              ],
              spacing: { after: 120 },
            })
          );
          currentParagraphText = '';
        }
      }
    }

    if (currentParagraphText.trim().length > 0) {
      docParagraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: currentParagraphText.trim(),
              size: 24,
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    fullExtractedText += `\n--- Page ${i} ---\n` + pageText;
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docParagraphs,
      },
    ],
  });

  const docxBlob = await Packer.toBlob(doc);
  const docxUrl = URL.createObjectURL(docxBlob);

  return {
    blob: docxBlob,
    url: docxUrl,
    extractedText: fullExtractedText.trim(),
  };
}

/**
 * Combine multiple images (JPG, PNG, WEBP) into a single paginated PDF
 */
export async function convertImagesToPdf(
  imageFiles: File[],
  onProgress?: (current: number, total: number) => void
): Promise<{ blob: Blob; url: string }> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imageFiles.length; i++) {
    onProgress?.(i + 1, imageFiles.length);
    const file = imageFiles[i];

    // Standardize to PNG or JPEG via canvas if WebP/other
    let imgBytes: Uint8Array;
    let isPng = file.type === 'image/png';
    let isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg';

    if (isPng || isJpg) {
      imgBytes = new Uint8Array(await file.arrayBuffer());
    } else {
      // Convert to PNG via canvas first
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(bitmap, 0, 0);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) continue;
      imgBytes = new Uint8Array(await blob.arrayBuffer());
      isPng = true;
      isJpg = false;
    }

    let embeddedImage;
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(imgBytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(imgBytes);
    }

    // Standard A4 dimensions in points (595.28 x 841.89)
    const a4Width = 595.28;
    const a4Height = 841.89;

    const imgDims = embeddedImage.scale(1);
    const ratio = Math.min((a4Width - 40) / imgDims.width, (a4Height - 40) / imgDims.height);
    const scaledWidth = imgDims.width * ratio;
    const scaledHeight = imgDims.height * ratio;

    const page = pdfDoc.addPage([a4Width, a4Height]);
    const x = (a4Width - scaledWidth) / 2;
    const y = (a4Height - scaledHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  const pdfBytes = await pdfDoc.save();
  // Create a copy of the buffer to avoid issues with SharedArrayBuffer or detached ArrayBuffer
  const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const pdfUrl = URL.createObjectURL(pdfBlob);

  return { blob: pdfBlob, url: pdfUrl };
}
