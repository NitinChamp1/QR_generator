'use client';

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FileCode,
  FileImage,
  FileType,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Image as ImageIcon,
  Layers,
  FileDown,
  Archive,
  MoveUp,
  MoveDown,
  Sparkles,
} from 'lucide-react';
import { ConverterMode, ImageFormat, ConvertedFile } from '@/types';
import { convertImage, formatFileSize, getExtensionForMime } from '@/utils/imageConverter';
import {
  convertPdfToDocx,
  convertPdfToImages,
  convertImagesToPdf,
  PDFPageImage,
} from '@/utils/pdfConverter';

export const FormatConverter: React.FC = () => {
  const [mode, setMode] = useState<ConverterMode>('image-to-image');

  // --- Image Converter State ---
  const [imageFiles, setImageFiles] = useState<ConvertedFile[]>([]);
  const [targetImageFormat, setTargetImageFormat] = useState<ImageFormat>('image/png');
  const [imageQuality, setImageQuality] = useState<number>(0.92);
  const [isConvertingImages, setIsConvertingImages] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- PDF to Word State ---
  const [pdfForDocx, setPdfForDocx] = useState<File | null>(null);
  const [docxResult, setDocxResult] = useState<{
    blob: Blob;
    url: string;
    extractedText: string;
    fileName: string;
  } | null>(null);
  const [isConvertingPdfToDocx, setIsConvertingPdfToDocx] = useState<boolean>(false);
  const [pdfDocxProgress, setPdfDocxProgress] = useState<{ current: number; total: number } | null>(
    null
  );
  const pdfDocxInputRef = useRef<HTMLInputElement>(null);

  // --- PDF to Images State ---
  const [pdfForImages, setPdfForImages] = useState<File | null>(null);
  const [pdfImagesResult, setPdfImagesResult] = useState<PDFPageImage[]>([]);
  const [isConvertingPdfToImages, setIsConvertingPdfToImages] = useState<boolean>(false);
  const [pdfImagesFormat, setPdfImagesFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [pdfImagesProgress, setPdfImagesProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const pdfImagesInputRef = useRef<HTMLInputElement>(null);

  // --- Images to PDF State ---
  const [imagesForPdf, setImagesForPdf] = useState<
    Array<{ id: string; file: File; preview: string }>
  >([]);
  const [pdfMergedResult, setPdfMergedResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isConvertingImagesToPdf, setIsConvertingImagesToPdf] = useState<boolean>(false);
  const imagesToPdfInputRef = useRef<HTMLInputElement>(null);

  // ==========================================
  // IMAGE CONVERTER HANDLERS
  // ==========================================
  const handleImageFilesSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles: ConvertedFile[] = Array.from(files).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      originalName: file.name,
      originalSize: file.size,
      originalType: file.type,
      previewUrl: URL.createObjectURL(file),
      convertedName: `${file.name.replace(/\.[^/.]+$/, '')}.${getExtensionForMime(
        targetImageFormat
      )}`,
      status: 'pending',
    }));

    setImageFiles((prev) => [...prev, ...newFiles]);
  };

  const handleConvertAllImages = async () => {
    if (imageFiles.length === 0) return;
    setIsConvertingImages(true);

    const ext = getExtensionForMime(targetImageFormat);

    for (let i = 0; i < imageFiles.length; i++) {
      const item = imageFiles[i];
      if (item.status === 'done') continue;

      // Update state to processing
      setImageFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'processing' } : f))
      );

      try {
        // Fetch blob from previewUrl or original file
        const resp = await fetch(item.previewUrl!);
        const blob = await resp.blob();
        const file = new File([blob], item.originalName, { type: item.originalType });

        const result = await convertImage(file, {
          format: targetImageFormat,
          quality: imageQuality,
        });

        setImageFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  status: 'done',
                  convertedBlob: result.blob,
                  convertedUrl: result.url,
                  convertedSize: result.blob.size,
                  convertedName: `${f.originalName.replace(/\.[^/.]+$/, '')}.${ext}`,
                }
              : f
          )
        );
      } catch (err: any) {
        setImageFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', errorMessage: err.message } : f
          )
        );
      }
    }

    setIsConvertingImages(false);
  };

  const handleDownloadAllImagesZip = async () => {
    const doneFiles = imageFiles.filter((f) => f.status === 'done' && f.convertedBlob);
    if (doneFiles.length === 0) return;

    const zip = new JSZip();
    for (const f of doneFiles) {
      zip.file(f.convertedName, f.convertedBlob!);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `converted_images_${Date.now()}.zip`);
  };

  // ==========================================
  // PDF TO WORD (.DOCX) HANDLERS
  // ==========================================
  const handlePdfForDocxSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }
    setPdfForDocx(file);
    setDocxResult(null);
  };

  const handleConvertPdfToDocx = async () => {
    if (!pdfForDocx) return;
    setIsConvertingPdfToDocx(true);
    setPdfDocxProgress({ current: 0, total: 1 });

    try {
      const res = await convertPdfToDocx(pdfForDocx, (current, total) => {
        setPdfDocxProgress({ current, total });
      });

      const outName = `${pdfForDocx.name.replace(/\.[^/.]+$/, '')}.docx`;
      setDocxResult({
        blob: res.blob,
        url: res.url,
        extractedText: res.extractedText,
        fileName: outName,
      });
    } catch (err: any) {
      console.error(err);
      alert('Failed to convert PDF to Word: ' + (err.message || 'Unknown error'));
    } finally {
      setIsConvertingPdfToDocx(false);
      setPdfDocxProgress(null);
    }
  };

  // ==========================================
  // PDF TO IMAGES HANDLERS
  // ==========================================
  const handlePdfForImagesSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      alert('Please upload a valid PDF document.');
      return;
    }
    setPdfForImages(file);
    setPdfImagesResult([]);
  };

  const handleConvertPdfToImages = async () => {
    if (!pdfForImages) return;
    setIsConvertingPdfToImages(true);

    try {
      const res = await convertPdfToImages(
        pdfForImages,
        pdfImagesFormat,
        2.0,
        (current, total) => {
          setPdfImagesProgress({ current, total });
        }
      );
      setPdfImagesResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to render PDF to images: ' + (err.message || 'Unknown error'));
    } finally {
      setIsConvertingPdfToImages(false);
      setPdfImagesProgress(null);
    }
  };

  const handleDownloadAllPdfImagesZip = async () => {
    if (pdfImagesResult.length === 0 || !pdfForImages) return;

    const zip = new JSZip();
    const ext = pdfImagesFormat === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = pdfForImages.name.replace(/\.[^/.]+$/, '');

    for (const page of pdfImagesResult) {
      zip.file(`${baseName}_page_${page.pageNumber}.${ext}`, page.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${baseName}_pages.zip`);
  };

  // ==========================================
  // IMAGES TO PDF HANDLERS
  // ==========================================
  const handleImagesForPdfSelect = (files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files).map((f) => ({
      id: `imgpdf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setImagesForPdf((prev) => [...prev, ...newImages]);
    setPdfMergedResult(null);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= imagesForPdf.length) return;
    const updated = [...imagesForPdf];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setImagesForPdf(updated);
  };

  const handleRemoveImage = (id: string) => {
    setImagesForPdf((prev) => prev.filter((img) => img.id !== id));
  };

  const handleConvertImagesToPdf = async () => {
    if (imagesForPdf.length === 0) return;
    setIsConvertingImagesToPdf(true);

    try {
      const files = imagesForPdf.map((img) => img.file);
      const res = await convertImagesToPdf(files);
      setPdfMergedResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to create PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsConvertingImagesToPdf(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          Universal Format Converter
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
          Convert seamlessly between image formats (JPEG, PNG, WEBP, BMP, ICO), transform PDF files
          into Microsoft Word (.docx) documents, convert PDF pages into high-res images, or merge multiple
          images into a clean PDF. 100% processed directly in your browser.
        </p>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setMode('image-to-image')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            mode === 'image-to-image'
              ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileImage className="w-4 h-4" />
          <span>Image Converter (JPG, PNG, WEBP, ICO)</span>
        </button>

        <button
          onClick={() => setMode('pdf-to-docx')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            mode === 'pdf-to-docx'
              ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileType className="w-4 h-4" />
          <span>PDF to Word (.docx)</span>
        </button>

        <button
          onClick={() => setMode('pdf-to-images')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            mode === 'pdf-to-images'
              ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>PDF to Images</span>
        </button>

        <button
          onClick={() => setMode('images-to-pdf')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            mode === 'images-to-pdf'
              ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          <FileDown className="w-4 h-4" />
          <span>Images to PDF</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: IMAGE CONVERTER */}
      {/* ========================================================= */}
      {mode === 'image-to-image' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                  Convert All To:
                </label>
                <select
                  value={targetImageFormat}
                  onChange={(e) => setTargetImageFormat(e.target.value as ImageFormat)}
                  className="px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-white"
                >
                  <option value="image/png">PNG (.png) - Lossless</option>
                  <option value="image/jpeg">JPEG (.jpg) - Universal</option>
                  <option value="image/webp">WEBP (.webp) - Modern Web</option>
                  <option value="image/bmp">BMP (.bmp) - Bitmap</option>
                  <option value="image/x-icon">ICO (.ico) - Favicon</option>
                </select>
              </div>

              {(targetImageFormat === 'image/jpeg' || targetImageFormat === 'image/webp') && (
                <div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Quality ({Math.round(imageQuality * 100)}%):
                  </label>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                    className="w-28 accent-emerald-600"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all"
              >
                <Upload className="w-4 h-4" />
                Add More Images
              </button>

              {imageFiles.some((f) => f.status === 'done') && (
                <button
                  onClick={handleDownloadAllImagesZip}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  <Archive className="w-4 h-4" />
                  Download All (ZIP)
                </button>
              )}

              {imageFiles.length > 0 && (
                <button
                  onClick={handleConvertAllImages}
                  disabled={isConvertingImages}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isConvertingImages ? 'animate-spin' : ''}`}
                  />
                  {isConvertingImages ? 'Converting...' : 'Convert Images'}
                </button>
              )}
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImageFilesSelect(e.target.files)}
          />

          {/* Upload Dropzone if empty */}
          {imageFiles.length === 0 ? (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/5 transition-all space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileImage className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  Drop images to convert or click to browse
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Supports JPG, PNG, WEBP, BMP, GIF, SVG, ICO. Convert single or multiple files in
                  parallel.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {imageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                        <img
                          src={file.previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-xs">
                          {file.originalName}
                        </p>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                          <span>{formatFileSize(file.originalSize)}</span>
                          {file.convertedSize && (
                            <>
                              <ArrowRight className="w-3 h-3 text-zinc-400" />
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatFileSize(file.convertedSize)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {file.status === 'done' && file.convertedUrl && (
                        <a
                          href={file.convertedUrl}
                          download={file.convertedName}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download {file.convertedName.split('.').pop()?.toUpperCase()}
                        </a>
                      )}

                      {file.status === 'processing' && (
                        <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Converting...
                        </span>
                      )}

                      {file.status === 'pending' && (
                        <span className="text-[11px] bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full font-medium text-zinc-500">
                          Ready
                        </span>
                      )}

                      <button
                        onClick={() =>
                          setImageFiles((prev) => prev.filter((item) => item.id !== file.id))
                        }
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: PDF TO WORD (.DOCX) */}
      {/* ========================================================= */}
      {mode === 'pdf-to-docx' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <input
              ref={pdfDocxInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handlePdfForDocxSelect(f);
              }}
            />

            <div
              onClick={() => pdfDocxInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
                pdfForDocx
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-zinc-300 dark:border-zinc-700 hover:border-blue-500'
              }`}
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <FileType className="w-7 h-7" />
              </div>
              <p className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
                {pdfForDocx ? pdfForDocx.name : 'Choose or Drag PDF File'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {pdfForDocx
                  ? formatFileSize(pdfForDocx.size)
                  : 'Converts all paragraphs, headings & content into an editable Microsoft Word .docx'}
              </p>
            </div>

            {pdfForDocx && (
              <button
                onClick={handleConvertPdfToDocx}
                disabled={isConvertingPdfToDocx}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isConvertingPdfToDocx ? 'animate-spin' : ''}`}
                />
                {isConvertingPdfToDocx
                  ? `Extracting Page ${pdfDocxProgress?.current ?? ''}...`
                  : 'Convert to Word (.docx)'}
              </button>
            )}
          </div>

          <div className="lg:col-span-7">
            {docxResult ? (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      Conversion Complete!
                    </span>
                  </div>
                  <a
                    href={docxResult.url}
                    download={docxResult.fileName}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download {docxResult.fileName}
                  </a>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                    Extracted Document Content Preview
                  </span>
                  <pre className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl text-xs font-mono text-zinc-700 dark:text-zinc-300 max-h-80 overflow-y-auto whitespace-pre-wrap border border-zinc-200 dark:border-zinc-800">
                    {docxResult.extractedText || 'No text content found in PDF.'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center bg-white dark:bg-zinc-900/40 text-zinc-500 text-xs">
                Select a PDF on the left and click &quot;Convert to Word&quot; to generate an editable .docx file.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: PDF TO IMAGES */}
      {/* ========================================================= */}
      {mode === 'pdf-to-images' && (
        <div className="space-y-6">
          <input
            ref={pdfImagesInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePdfForImagesSelect(f);
            }}
          />

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => pdfImagesInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all"
              >
                <Upload className="w-4 h-4" />
                {pdfForImages ? 'Change PDF' : 'Select PDF File'}
              </button>
              {pdfForImages && (
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {pdfForImages.name} ({formatFileSize(pdfForImages.size)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-500 font-semibold">Image Format:</span>
                <select
                  value={pdfImagesFormat}
                  onChange={(e) => setPdfImagesFormat(e.target.value as any)}
                  className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold"
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                </select>
              </div>

              {pdfForImages && (
                <button
                  onClick={handleConvertPdfToImages}
                  disabled={isConvertingPdfToImages}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isConvertingPdfToImages ? 'animate-spin' : ''}`}
                  />
                  {isConvertingPdfToImages
                    ? `Rendering Page ${pdfImagesProgress?.current ?? ''}...`
                    : 'Render Pages to Images'}
                </button>
              )}

              {pdfImagesResult.length > 0 && (
                <button
                  onClick={handleDownloadAllPdfImagesZip}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-800 text-white text-xs font-semibold transition-all"
                >
                  <Archive className="w-4 h-4" />
                  Download All Pages (.ZIP)
                </button>
              )}
            </div>
          </div>

          {/* Rendered Pages Gallery */}
          {pdfImagesResult.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pdfImagesResult.map((page) => (
                <div
                  key={page.pageNumber}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs space-y-2 p-3"
                >
                  <div className="aspect-[3/4] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                    <img
                      src={page.url}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Page {page.pageNumber}
                    </span>
                    <a
                      href={page.url}
                      download={`page_${page.pageNumber}.${
                        pdfImagesFormat === 'image/jpeg' ? 'jpg' : 'png'
                      }`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      Save
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: IMAGES TO PDF */}
      {/* ========================================================= */}
      {mode === 'images-to-pdf' && (
        <div className="space-y-6">
          <input
            ref={imagesToPdfInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleImagesForPdfSelect(e.target.files)}
          />

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <button
              onClick={() => imagesToPdfInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all"
            >
              <Upload className="w-4 h-4" />
              Add Images / Photos
            </button>

            <div className="flex items-center gap-3">
              {imagesForPdf.length > 0 && (
                <button
                  onClick={handleConvertImagesToPdf}
                  disabled={isConvertingImagesToPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isConvertingImagesToPdf ? 'animate-spin' : ''}`}
                  />
                  {isConvertingImagesToPdf ? 'Merging PDF...' : 'Merge All into 1 PDF'}
                </button>
              )}

              {pdfMergedResult && (
                <a
                  href={pdfMergedResult.url}
                  download={`merged_document_${Date.now()}.pdf`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              )}
            </div>
          </div>

          {imagesForPdf.length === 0 ? (
            <div
              onClick={() => imagesToPdfInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl p-12 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-50 dark:bg-zinc-800 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <FileDown className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-zinc-900 dark:text-white">
                  Add images to combine into a PDF document
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Upload multiple photos, receipts, or page scans. Reorder them and combine into a single
                  clean PDF!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagesForPdf.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 shadow-xs"
                >
                  <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    <img
                      src={item.preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300">
                      Page {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20"
                        title="Move Up"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveImage(index, 'down')}
                        disabled={index === imagesForPdf.length - 1}
                        className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-20"
                        title="Move Down"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(item.id)}
                        className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
