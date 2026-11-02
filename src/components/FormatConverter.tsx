'use client';

import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
  FileImage,
  FileType,
  RefreshCw,
  Upload,
  Download,
  Trash2,
  ArrowRight,
  Layers,
  FileDown,
  Archive,
  MoveUp,
  MoveDown,
  ArrowUpRight,
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

      setImageFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'processing' } : f))
      );

      try {
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
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="tako-panel p-5 space-y-2">
        <span className="font-mono text-[11px] font-bold text-[#ff5500] uppercase tracking-wider block">
          [ PIPELINE // 03 · FORMAT_CONVERTER ]
        </span>
        <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight uppercase text-black">
          FORMAT<span className="text-[#ff5500]">CONVERTER</span>
        </h1>
        <p className="text-[11px] font-mono text-stone-500 max-w-2xl">
          CONVERT · COMPILE · MERGE — IMAGES (JPG, PNG, WEBP, ICO), PDF TO WORD (.DOCX) &amp; IMAGES TO PDF.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setMode('image-to-image')}
          className={`tako-btn ${mode === 'image-to-image' ? 'tako-btn-orange' : ''}`}
        >
          <FileImage className="w-4 h-4" />
          <span>[1] Image Converter (JPG, PNG, WEBP, ICO)</span>
        </button>

        <button
          onClick={() => setMode('pdf-to-docx')}
          className={`tako-btn ${mode === 'pdf-to-docx' ? 'tako-btn-orange' : ''}`}
        >
          <FileType className="w-4 h-4" />
          <span>[2] PDF to Word (.docx)</span>
        </button>

        <button
          onClick={() => setMode('pdf-to-images')}
          className={`tako-btn ${mode === 'pdf-to-images' ? 'tako-btn-orange' : ''}`}
        >
          <Layers className="w-4 h-4" />
          <span>[3] PDF to Images</span>
        </button>

        <button
          onClick={() => setMode('images-to-pdf')}
          className={`tako-btn ${mode === 'images-to-pdf' ? 'tako-btn-orange' : ''}`}
        >
          <FileDown className="w-4 h-4" />
          <span>[4] Images to PDF</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: IMAGE CONVERTER */}
      {/* ========================================================= */}
      {mode === 'image-to-image' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="tako-panel p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="tako-label">TARGET_FORMAT:</span>
                <select
                  value={targetImageFormat}
                  onChange={(e) => setTargetImageFormat(e.target.value as ImageFormat)}
                  className="tako-input py-1 text-xs font-bold"
                  style={{ width: 'auto' }}
                >
                  <option value="image/png">PNG (.png) - LOSSLESS</option>
                  <option value="image/jpeg">JPEG (.jpg) - UNIVERSAL</option>
                  <option value="image/webp">WEBP (.webp) - WEB OPTIMIZED</option>
                  <option value="image/bmp">BMP (.bmp) - BITMAP</option>
                  <option value="image/x-icon">ICO (.ico) - FAVICON</option>
                </select>
              </div>

              {(targetImageFormat === 'image/jpeg' || targetImageFormat === 'image/webp') && (
                <div className="flex items-center gap-2">
                  <span className="tako-label">
                    QUALITY ({Math.round(imageQuality * 100)}%):
                  </span>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                    className="accent-[#ff5500] w-24"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="tako-btn"
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                <Upload className="w-3.5 h-3.5 text-[#ff5500]" />
                + ADD IMAGES
              </button>

              {imageFiles.some((f) => f.status === 'done') && (
                <button
                  onClick={handleDownloadAllImagesZip}
                  className="tako-btn tako-btn-black"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  <Archive className="w-3.5 h-3.5" />
                  DOWNLOAD ALL (ZIP)
                </button>
              )}

              {imageFiles.length > 0 && (
                <button
                  onClick={handleConvertAllImages}
                  disabled={isConvertingImages}
                  className="tako-btn tako-btn-orange"
                  style={{ padding: '6px 16px', fontSize: '11px' }}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isConvertingImages ? 'animate-spin' : ''}`}
                  />
                  {isConvertingImages ? 'CONVERTING...' : 'RUN CONVERSION'}
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

          {imageFiles.length === 0 ? (
            <div
              onClick={() => imageInputRef.current?.click()}
              className="tako-dropzone p-12 text-center space-y-3"
            >
              <div className="w-12 h-12 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                <FileImage className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-black">
                  DROP IMAGES HERE OR CLICK TO BROWSE
                </p>
                <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                  JPG · PNG · WEBP · BMP · ICO // CLIENT-SIDE BATCH CONVERSIONS
                </p>
              </div>
            </div>
          ) : (
            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// CONVERSION_QUEUE</span>
                <span className="tako-badge">{imageFiles.length} FILES</span>
              </div>

              <div className="divide-y divide-stone-200 bg-white">
                {imageFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 flex flex-wrap items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 border border-black bg-stone-50 overflow-hidden flex-shrink-0">
                        <img
                          src={file.previewUrl}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-black truncate max-w-xs">{file.originalName}</p>
                        <p className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                          <span>{formatFileSize(file.originalSize)}</span>
                          {file.convertedSize && (
                            <>
                              <ArrowRight className="w-3 h-3 text-black" />
                              <span className="font-bold text-[#ff5500] bg-orange-50 border border-orange-200 px-1">
                                {formatFileSize(file.convertedSize)}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {file.status === 'done' && file.convertedUrl && (
                        <a
                          href={file.convertedUrl}
                          download={file.convertedName}
                          className="tako-btn tako-btn-orange"
                          style={{ padding: '4px 10px', fontSize: '10px' }}
                        >
                          <Download className="w-3 h-3" />
                          SAVE {file.convertedName.split('.').pop()?.toUpperCase()}
                        </a>
                      )}

                      {file.status === 'processing' && (
                        <span className="tako-badge-orange text-[10px]">
                          CONVERTING...
                        </span>
                      )}

                      {file.status === 'pending' && (
                        <span className="tako-badge text-[10px]">
                          READY
                        </span>
                      )}

                      {file.status === 'error' && (
                        <span className="tako-badge text-red-600 border-red-600 text-[10px]">
                          ERROR: {file.errorMessage}
                        </span>
                      )}

                      <button
                        onClick={() =>
                          setImageFiles((prev) => prev.filter((f) => f.id !== file.id))
                        }
                        className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                        title="Remove"
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

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// PDF_SOURCE</span>
                <span className="text-[10px] text-stone-500 font-bold">PDF.JS ENGINE</span>
              </div>

              <div className="p-5 space-y-4 bg-white text-center">
                <div
                  onClick={() => pdfDocxInputRef.current?.click()}
                  className="tako-dropzone p-6 space-y-2"
                >
                  <div className="w-12 h-12 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                    <FileType className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <p className="text-xs font-mono font-bold uppercase mt-2 text-black">
                    {pdfForDocx ? pdfForDocx.name : 'CLICK TO SELECT PDF FILE'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {pdfForDocx
                      ? formatFileSize(pdfForDocx.size)
                      : 'Extracts paragraphs and headings into a formatted .docx document'}
                  </p>
                </div>

                {pdfForDocx && (
                  <button
                    onClick={handleConvertPdfToDocx}
                    disabled={isConvertingPdfToDocx}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isConvertingPdfToDocx ? 'animate-spin' : ''}`}
                    />
                    {isConvertingPdfToDocx
                      ? `PARSING PAGE ${pdfDocxProgress?.current ?? ''}...`
                      : 'CONVERT TO WORD (.DOCX)'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {docxResult ? (
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <span className="font-bold">// CONVERSION_COMPLETE</span>
                  <span className="tako-badge-orange text-[10px]">DOCX READY</span>
                </div>

                <div className="p-5 bg-white space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-black">
                    <span className="font-mono text-xs font-bold text-black">
                      OUTPUT: {docxResult.fileName}
                    </span>
                    <a
                      href={docxResult.url}
                      download={docxResult.fileName}
                      className="tako-btn tako-btn-orange"
                      style={{ padding: '6px 12px', fontSize: '11px' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      SAVE .DOCX
                    </a>
                  </div>

                  <div>
                    <span className="tako-label-muted block mb-1">
                      EXTRACTED_CONTENT_PREVIEW:
                    </span>
                    <pre className="p-3 bg-stone-50 border-2 border-black text-xs font-mono max-h-72 overflow-y-auto whitespace-pre-wrap text-black">
                      {docxResult.extractedText || '// No text extracted from document.'}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Select a PDF on the left and click &quot;CONVERT TO WORD&quot; to compile into a .docx document.
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

          <div className="tako-panel p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs bg-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => pdfImagesInputRef.current?.click()}
                className="tako-btn"
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                <Upload className="w-3.5 h-3.5 text-[#ff5500]" />
                {pdfForImages ? 'CHANGE PDF' : 'SELECT PDF FILE'}
              </button>
              {pdfForImages && (
                <span className="font-bold text-black">
                  {pdfForImages.name} ({formatFileSize(pdfForImages.size)})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="tako-label">FORMAT:</span>
                <select
                  value={pdfImagesFormat}
                  onChange={(e) => setPdfImagesFormat(e.target.value as any)}
                  className="tako-input py-1 text-xs font-bold"
                  style={{ width: 'auto' }}
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPEG</option>
                </select>
              </div>

              {pdfForImages && (
                <button
                  onClick={handleConvertPdfToImages}
                  disabled={isConvertingPdfToImages}
                  className="tako-btn tako-btn-orange"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isConvertingPdfToImages ? 'animate-spin' : ''}`}
                  />
                  {isConvertingPdfToImages
                    ? `RENDERING P.${pdfImagesProgress?.current ?? ''}...`
                    : 'RENDER ALL PAGES'}
                </button>
              )}

              {pdfImagesResult.length > 0 && (
                <button
                  onClick={handleDownloadAllPdfImagesZip}
                  className="tako-btn tako-btn-black"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  <Archive className="w-3.5 h-3.5" />
                  DOWNLOAD ALL (ZIP)
                </button>
              )}
            </div>
          </div>

          {pdfImagesResult.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pdfImagesResult.map((page) => (
                <div key={page.pageNumber} className="tako-panel overflow-hidden p-2 space-y-2 bg-white">
                  <div className="aspect-[3/4] bg-stone-50 border-2 border-black flex items-center justify-center overflow-hidden">
                    <img
                      src={page.url}
                      alt={`Page ${page.pageNumber}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-black">PAGE #{page.pageNumber}</span>
                    <a
                      href={page.url}
                      download={`page_${page.pageNumber}.${
                        pdfImagesFormat === 'image/jpeg' ? 'jpg' : 'png'
                      }`}
                      className="tako-btn tako-btn-orange"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                    >
                      <Download className="w-3 h-3" />
                      SAVE
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

          <div className="tako-panel p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs bg-white">
            <button
              onClick={() => imagesToPdfInputRef.current?.click()}
              className="tako-btn"
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Upload className="w-3.5 h-3.5 text-[#ff5500]" />
              + ADD IMAGES / SCANS
            </button>

            <div className="flex items-center gap-3">
              {imagesForPdf.length > 0 && (
                <button
                  onClick={handleConvertImagesToPdf}
                  disabled={isConvertingImagesToPdf}
                  className="tako-btn tako-btn-orange"
                  style={{ padding: '6px 16px', fontSize: '11px' }}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isConvertingImagesToPdf ? 'animate-spin' : ''}`}
                  />
                  {isConvertingImagesToPdf ? 'MERGING...' : 'MERGE ALL INTO 1 PDF'}
                </button>
              )}

              {pdfMergedResult && (
                <a
                  href={pdfMergedResult.url}
                  download={`merged_${Date.now()}.pdf`}
                  className="tako-btn tako-btn-black"
                  style={{ padding: '6px 16px', fontSize: '11px' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD PDF
                </a>
              )}
            </div>
          </div>

          {imagesForPdf.length === 0 ? (
            <div
              onClick={() => imagesToPdfInputRef.current?.click()}
              className="tako-dropzone p-12 text-center space-y-2"
            >
              <div className="w-12 h-12 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                <FileDown className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-mono font-bold uppercase text-black">
                  ADD IMAGES TO COMPILE INTO A PAGINATED PDF
                </p>
                <p className="text-[10px] font-mono text-stone-500 mt-1">
                  Upload multiple photos or receipts. Reorder pages and compile into a single document.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imagesForPdf.map((item, index) => (
                <div key={item.id} className="tako-panel p-2 space-y-2 font-mono text-xs bg-white">
                  <div className="aspect-[4/3] bg-stone-50 border-2 border-black overflow-hidden">
                    <img
                      src={item.preview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-black">PAGE #{index + 1}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveImage(index, 'up')}
                        disabled={index === 0}
                        className="p-1 border border-black hover:bg-stone-100 disabled:opacity-20 text-black cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveImage(index, 'down')}
                        disabled={index === imagesForPdf.length - 1}
                        className="p-1 border border-black hover:bg-stone-100 disabled:opacity-20 text-black cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleRemoveImage(item.id)}
                        className="p-1 border border-black hover:bg-[#ff5500] hover:text-white text-stone-600 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
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
