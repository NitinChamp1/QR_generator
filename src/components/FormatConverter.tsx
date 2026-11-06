'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  Merge,
  Split,
  RotateCw,
  FileSignature,
  FileCode,
  Sliders,
  Type,
  Copy,
  Check,
  Plus,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { ConverterMode, ToolCategory, ImageFormat, ConvertedFile } from '@/types';
import { convertImage, formatFileSize, getExtensionForMime } from '@/utils/imageConverter';
import {
  convertPdfToDocx,
  convertPdfToImages,
  convertImagesToPdf,
  PDFPageImage,
} from '@/utils/pdfConverter';
import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  reorderAndFilterPdf,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  stampSignatureOnPdf,
  convertPdfToMarkdown,
} from '@/utils/pdfSuite';

export const FormatConverter: React.FC = () => {
  // Navigation & Category states
  const [activeCategory, setActiveCategory] = useState<ToolCategory>('convert');
  const [mode, setMode] = useState<ConverterMode>('image-to-image');

  // --- Sub-Tab 1: Image Converter State ---
  const [imageFiles, setImageFiles] = useState<ConvertedFile[]>([]);
  const [targetImageFormat, setTargetImageFormat] = useState<ImageFormat>('image/png');
  const [imageQuality, setImageQuality] = useState<number>(0.92);
  const [isConvertingImages, setIsConvertingImages] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- Sub-Tab 2: PDF to Word State ---
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

  // --- Sub-Tab 3: PDF to Images State ---
  const [pdfForImages, setPdfForImages] = useState<File | null>(null);
  const [pdfImagesResult, setPdfImagesResult] = useState<PDFPageImage[]>([]);
  const [isConvertingPdfToImages, setIsConvertingPdfToImages] = useState<boolean>(false);
  const [pdfImagesFormat, setPdfImagesFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [pdfImagesProgress, setPdfImagesProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const pdfImagesInputRef = useRef<HTMLInputElement>(null);

  // --- Sub-Tab 4: Images to PDF State ---
  const [imagesForPdf, setImagesForPdf] = useState<
    Array<{ id: string; file: File; preview: string }>
  >([]);
  const [pdfMergedResult, setPdfMergedResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isConvertingImagesToPdf, setIsConvertingImagesToPdf] = useState<boolean>(false);
  const imagesToPdfInputRef = useRef<HTMLInputElement>(null);

  // --- Sub-Tab 5: PDF to Markdown State ---
  const [pdfForMarkdown, setPdfForMarkdown] = useState<File | null>(null);
  const [markdownResult, setMarkdownResult] = useState<string>('');
  const [isConvertingPdfToMarkdown, setIsConvertingPdfToMarkdown] = useState<boolean>(false);
  const [copiedMd, setCopiedMd] = useState<boolean>(false);
  const pdfMarkdownInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Merge PDF State ---
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [mergedPdfResult, setMergedPdfResult] = useState<{ blob: Blob; url: string; pageCount: number } | null>(null);
  const [isMergingPdfs, setIsMergingPdfs] = useState<boolean>(false);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Split PDF State ---
  const [pdfForSplit, setPdfForSplit] = useState<File | null>(null);
  const [splitMode, setSplitMode] = useState<'all_pages' | 'ranges'>('all_pages');
  const [splitRanges, setSplitRanges] = useState<string>('1-2, 3');
  const [splitResults, setSplitResults] = useState<Array<{ fileName: string; blob: Blob; url: string; pageCount: number }>>([]);
  const [isSplittingPdf, setIsSplittingPdf] = useState<boolean>(false);
  const splitInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Rotate PDF State ---
  const [pdfForRotate, setPdfForRotate] = useState<File | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [rotateScope, setRotateScope] = useState<'all' | 'specific'>('all');
  const [specificPageNum, setSpecificPageNum] = useState<number>(1);
  const [rotateResult, setRotateResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isRotatingPdf, setIsRotatingPdf] = useState<boolean>(false);
  const rotateInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Organize / Delete Pages State ---
  const [pdfForOrganize, setPdfForOrganize] = useState<File | null>(null);
  const [pageOrderList, setPageOrderList] = useState<number[]>([]);
  const [organizeResult, setOrganizeResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isOrganizingPdf, setIsOrganizingPdf] = useState<boolean>(false);
  const organizeInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Watermark PDF State ---
  const [pdfForWatermark, setPdfForWatermark] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.25);
  const [watermarkColor, setWatermarkColor] = useState<string>('#ff5500');
  const [watermarkResult, setWatermarkResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isWatermarkingPdf, setIsWatermarkingPdf] = useState<boolean>(false);
  const watermarkInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Page Numbers State ---
  const [pdfForPageNumbers, setPdfForPageNumbers] = useState<File | null>(null);
  const [numberFormat, setNumberFormat] = useState<'page_of_total' | 'simple' | 'brackets'>('page_of_total');
  const [numberPosition, setNumberPosition] = useState<'bottom_center' | 'bottom_right' | 'top_right'>('bottom_center');
  const [pageNumbersResult, setPageNumbersResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isAddingPageNumbers, setIsAddingPageNumbers] = useState<boolean>(false);
  const pageNumbersInputRef = useRef<HTMLInputElement>(null);

  // --- Group 1: Sign PDF State ---
  const [pdfForSign, setPdfForSign] = useState<File | null>(null);
  const [signTargetPage, setSignTargetPage] = useState<number>(1);
  const [signPositionX, setSignPositionX] = useState<number>(60);
  const [signPositionY, setSignPositionY] = useState<number>(60);
  const [signResult, setSignResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [isSigningPdf, setIsSigningPdf] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const signInputRef = useRef<HTMLInputElement>(null);

  // Setup signature canvas context
  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111111';
  }, [mode]);

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
        const result = await convertImage(file, { format: targetImageFormat, quality: imageQuality });

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
          prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMessage: err.message } : f))
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
  // PDF TO WORD HANDLERS
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
      const res = await convertPdfToImages(pdfForImages, pdfImagesFormat, 2.0, (current, total) => {
        setPdfImagesProgress({ current, total });
      });
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

  // ==========================================
  // PDF TO MARKDOWN HANDLERS
  // ==========================================
  const handleConvertPdfToMarkdown = async () => {
    if (!pdfForMarkdown) return;
    setIsConvertingPdfToMarkdown(true);
    try {
      const md = await convertPdfToMarkdown(pdfForMarkdown);
      setMarkdownResult(md);
    } catch (err: any) {
      console.error(err);
      alert('Failed to extract markdown: ' + (err.message || 'Unknown error'));
    } finally {
      setIsConvertingPdfToMarkdown(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!markdownResult) return;
    navigator.clipboard.writeText(markdownResult);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!markdownResult || !pdfForMarkdown) return;
    const blob = new Blob([markdownResult], { type: 'text/markdown;charset=utf-8' });
    saveAs(blob, `${pdfForMarkdown.name.replace(/\.[^/.]+$/, '')}.md`);
  };

  // ==========================================
  // GROUP 1: MERGE PDF HANDLERS
  // ==========================================
  const handleMergeFilesSelect = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );
    setMergeFiles((prev) => [...prev, ...valid]);
    setMergedPdfResult(null);
  };

  const handleRunMerge = async () => {
    if (mergeFiles.length < 2) {
      alert('Please select at least 2 PDF files to merge.');
      return;
    }
    setIsMergingPdfs(true);
    try {
      const res = await mergePdfs(mergeFiles);
      setMergedPdfResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to merge PDFs: ' + (err.message || 'Unknown error'));
    } finally {
      setIsMergingPdfs(false);
    }
  };

  // ==========================================
  // GROUP 1: SPLIT PDF HANDLERS
  // ==========================================
  const handleRunSplit = async () => {
    if (!pdfForSplit) return;
    setIsSplittingPdf(true);
    try {
      const res = await splitPdf(pdfForSplit, splitMode, splitRanges);
      setSplitResults(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to split PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSplittingPdf(false);
    }
  };

  const handleDownloadAllSplitZip = async () => {
    if (splitResults.length === 0 || !pdfForSplit) return;
    const zip = new JSZip();
    for (const item of splitResults) {
      zip.file(item.fileName, item.blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `${pdfForSplit.name.replace(/\.[^/.]+$/, '')}_split.zip`);
  };

  // ==========================================
  // GROUP 1: ROTATE PDF HANDLERS
  // ==========================================
  const handleRunRotate = async () => {
    if (!pdfForRotate) return;
    setIsRotatingPdf(true);
    try {
      const targetIndices = rotateScope === 'all' ? undefined : [specificPageNum - 1];
      const res = await rotatePdf(pdfForRotate, rotationAngle, targetIndices);
      setRotateResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to rotate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRotatingPdf(false);
    }
  };

  // ==========================================
  // GROUP 1: ORGANIZE & DELETE PAGES HANDLERS
  // ==========================================
  const handlePdfForOrganizeSelect = async (file: File) => {
    setPdfForOrganize(file);
    setOrganizeResult(null);
    try {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuf) }).promise;
      const initialPages = Array.from({ length: pdf.numPages }, (_, i) => i);
      setPageOrderList(initialPages);
    } catch (err) {
      console.error('Error loading PDF pages:', err);
    }
  };

  const handleMoveOrganizePage = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= pageOrderList.length) return;
    const updated = [...pageOrderList];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setPageOrderList(updated);
  };

  const handleDeleteOrganizePage = (index: number) => {
    if (pageOrderList.length <= 1) {
      alert('A PDF must contain at least 1 page.');
      return;
    }
    setPageOrderList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRunOrganize = async () => {
    if (!pdfForOrganize || pageOrderList.length === 0) return;
    setIsOrganizingPdf(true);
    try {
      const res = await reorderAndFilterPdf(pdfForOrganize, pageOrderList);
      setOrganizeResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to reorder PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsOrganizingPdf(false);
    }
  };

  // ==========================================
  // GROUP 1: WATERMARK PDF HANDLERS
  // ==========================================
  const handleRunWatermark = async () => {
    if (!pdfForWatermark || !watermarkText.trim()) return;
    setIsWatermarkingPdf(true);
    try {
      const res = await addWatermarkToPdf(pdfForWatermark, watermarkText, watermarkOpacity, watermarkColor);
      setWatermarkResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to watermark PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsWatermarkingPdf(false);
    }
  };

  // ==========================================
  // GROUP 1: PAGE NUMBERS HANDLERS
  // ==========================================
  const handleRunPageNumbers = async () => {
    if (!pdfForPageNumbers) return;
    setIsAddingPageNumbers(true);
    try {
      const res = await addPageNumbersToPdf(pdfForPageNumbers, numberFormat, numberPosition);
      setPageNumbersResult(res);
    } catch (err: any) {
      console.error(err);
      alert('Failed to add page numbers: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAddingPageNumbers(false);
    }
  };

  // ==========================================
  // GROUP 1: SIGN PDF HANDLERS
  // ==========================================
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleRunSign = async () => {
    if (!pdfForSign) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (sigBlob) => {
      if (!sigBlob) {
        alert('Please draw a signature first.');
        return;
      }
      setIsSigningPdf(true);
      try {
        const res = await stampSignatureOnPdf(pdfForSign, sigBlob, signTargetPage, {
          x: signPositionX,
          y: signPositionY,
          width: 150,
          height: 60,
        });
        setSignResult(res);
      } catch (err: any) {
        console.error(err);
        alert('Failed to stamp signature: ' + (err.message || 'Unknown error'));
      } finally {
        setIsSigningPdf(false);
      }
    }, 'image/png');
  };

  // ==========================================
  // TOOL DEFINITIONS & CATEGORIES
  // ==========================================
  const toolCategories = [
    {
      id: 'convert',
      label: 'DOCUMENT CONVERT',
      count: 5,
      tools: [
        { id: 'image-to-image', label: 'Image Converter', icon: FileImage },
        { id: 'pdf-to-docx', label: 'PDF to Word (.docx)', icon: FileType },
        { id: 'pdf-to-images', label: 'PDF to Images', icon: Layers },
        { id: 'images-to-pdf', label: 'Images to PDF', icon: FileDown },
        { id: 'pdf-to-markdown', label: 'PDF to Markdown', icon: FileCode },
      ],
    },
    {
      id: 'organize',
      label: 'ORGANIZE & EDIT',
      count: 4,
      tools: [
        { id: 'merge-pdf', label: 'Merge PDF', icon: Merge },
        { id: 'split-pdf', label: 'Split PDF', icon: Split },
        { id: 'rotate-pdf', label: 'Rotate PDF', icon: RotateCw },
        { id: 'organize-pdf', label: 'Reorder / Delete', icon: Sliders },
      ],
    },
    {
      id: 'security',
      label: 'STAMP & SIGN',
      count: 3,
      tools: [
        { id: 'sign-pdf', label: 'Sign PDF', icon: FileSignature },
        { id: 'watermark-pdf', label: 'Watermark PDF', icon: Type },
        { id: 'page-numbers-pdf', label: 'Page Numbers', icon: FileDown },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* TAKO Hero Banner */}
      <div className="tako-panel p-5 space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#ff5500] uppercase tracking-wider block">
              [ WORKBENCH // 03 · CONVERT &amp; PDF WORKSTATION ]
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight uppercase text-black">
              FORMAT &amp; PDF <span className="text-[#ff5500]">STUDIO</span>
            </h1>
            <p className="text-[11px] font-mono text-stone-500 max-w-2xl">
              100% IN-BROWSER EXECUTION · DOCUMENT CONVERSIONS, PAGE OPERATIONS &amp; VECTOR SIGNATURES.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="tako-badge font-mono text-[10px]">
              ENGINE: CLIENT_WASM &amp; PDF-LIB
            </span>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="tako-panel p-2.5 bg-stone-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {toolCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id as ToolCategory);
                setMode(cat.tools[0].id as ConverterMode);
              }}
              className={`tako-btn ${
                activeCategory === cat.id ? 'tako-btn-black' : 'bg-white'
              }`}
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              <span>{cat.label}</span>
              <span
                className={`ml-1 text-[10px] px-1.5 py-0.2 ${
                  activeCategory === cat.id ? 'bg-[#ff5500] text-white' : 'bg-stone-100 text-black'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <span className="text-[10px] font-mono font-bold text-stone-500 hidden md:inline">
          ZERO_SERVER_LATENCY // 100% PRIVATE
        </span>
      </div>

      {/* Tools Segmented Sub-Bar under Active Category */}
      <div className="flex flex-wrap gap-2">
        {toolCategories
          .find((c) => c.id === activeCategory)
          ?.tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = mode === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setMode(tool.id as ConverterMode)}
                className={`tako-btn ${isActive ? 'tako-btn-orange' : 'bg-white'}`}
                style={{ padding: '6px 12px', fontSize: '11px' }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tool.label}</span>
              </button>
            );
          })}
      </div>

      {/* ========================================================= */}
      {/* [1] IMAGE CONVERTER */}
      {/* ========================================================= */}
      {mode === 'image-to-image' && (
        <div className="space-y-6">
          <div className="tako-panel p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs bg-white">
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
                style={{ padding: '6px 14px', fontSize: '11px' }}
              >
                <Upload className="w-3.5 h-3.5 text-[#ff5500]" />
                + ADD IMAGES
              </button>

              {imageFiles.some((f) => f.status === 'done') && (
                <button
                  onClick={handleDownloadAllImagesZip}
                  className="tako-btn tako-btn-black"
                  style={{ padding: '6px 14px', fontSize: '11px' }}
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
                  JPG · PNG · WEBP · BMP · ICO // CLIENT-SIDE BATCH TRANSCODING
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
                        <span className="tako-badge-orange text-[10px]">CONVERTING...</span>
                      )}
                      {file.status === 'pending' && (
                        <span className="tako-badge text-[10px]">READY</span>
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
      {/* [2] PDF TO WORD */}
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
                  className="tako-dropzone p-8 space-y-2"
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
      {/* [3] PDF TO IMAGES */}
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
                style={{ padding: '6px 14px', fontSize: '11px' }}
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
                  style={{ padding: '6px 14px', fontSize: '11px' }}
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
                  style={{ padding: '6px 14px', fontSize: '11px' }}
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
      {/* [4] IMAGES TO PDF */}
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
              style={{ padding: '6px 14px', fontSize: '11px' }}
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
                  download={`compiled_${Date.now()}.pdf`}
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

      {/* ========================================================= */}
      {/* [5] PDF TO MARKDOWN */}
      {/* ========================================================= */}
      {mode === 'pdf-to-markdown' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <input
              ref={pdfMarkdownInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfForMarkdown(f);
                  setMarkdownResult('');
                }
              }}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// PDF_SOURCE</span>
                <span className="text-[10px] text-stone-500 font-bold">STRUCTURE PARSER</span>
              </div>

              <div className="p-5 space-y-4 bg-white text-center">
                <div
                  onClick={() => pdfMarkdownInputRef.current?.click()}
                  className="tako-dropzone p-8 space-y-2"
                >
                  <div className="w-12 h-12 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                    <FileCode className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <p className="text-xs font-mono font-bold uppercase mt-2 text-black">
                    {pdfForMarkdown ? pdfForMarkdown.name : 'CLICK TO SELECT PDF FILE'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {pdfForMarkdown
                      ? formatFileSize(pdfForMarkdown.size)
                      : 'Parses headings, lists, and paragraphs into formatted Markdown'}
                  </p>
                </div>

                {pdfForMarkdown && (
                  <button
                    onClick={handleConvertPdfToMarkdown}
                    disabled={isConvertingPdfToMarkdown}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isConvertingPdfToMarkdown ? 'animate-spin' : ''}`}
                    />
                    {isConvertingPdfToMarkdown ? 'EXTRACTING...' : 'EXTRACT TO MARKDOWN (.MD)'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {markdownResult ? (
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <span className="font-bold">// MARKDOWN_OUTPUT</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyMarkdown}
                      className="tako-btn"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                    >
                      {copiedMd ? <Check className="w-3 h-3 text-[#ff5500]" /> : <Copy className="w-3 h-3" />}
                      {copiedMd ? 'COPIED' : 'COPY'}
                    </button>
                    <button
                      onClick={handleDownloadMarkdown}
                      className="tako-btn tako-btn-orange"
                      style={{ padding: '2px 8px', fontSize: '10px' }}
                    >
                      <Download className="w-3 h-3" />
                      SAVE .MD
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white">
                  <pre className="p-3 bg-stone-50 border-2 border-black text-xs font-mono max-h-96 overflow-y-auto whitespace-pre-wrap text-black">
                    {markdownResult}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Upload a PDF on the left and click &quot;EXTRACT TO MARKDOWN&quot; to generate formatted markdown documentation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* [6] MERGE PDF */}
      {/* ========================================================= */}
      {mode === 'merge-pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <input
              ref={mergeInputRef}
              type="file"
              multiple
              accept="application/pdf"
              className="hidden"
              onChange={(e) => handleMergeFilesSelect(e.target.files)}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// MERGE_SOURCE_QUEUE</span>
                <span className="tako-badge">{mergeFiles.length} FILES</span>
              </div>

              <div className="p-4 bg-white space-y-4">
                <div
                  onClick={() => mergeInputRef.current?.click()}
                  className="tako-dropzone p-6 space-y-2"
                >
                  <Merge className="w-8 h-8 text-[#ff5500] mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase text-black">
                    ADD PDF FILES TO COMBINE
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    Select 2 or more PDFs in the order you wish to merge them
                  </p>
                </div>

                {mergeFiles.length > 0 && (
                  <div className="divide-y divide-stone-200 border-2 border-black max-h-60 overflow-y-auto">
                    {mergeFiles.map((file, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs font-mono bg-white">
                        <span className="font-bold truncate max-w-xs">
                          {idx + 1}. {file.name} ({formatFileSize(file.size)})
                        </span>
                        <button
                          onClick={() => setMergeFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleRunMerge}
                  disabled={mergeFiles.length < 2 || isMergingPdfs}
                  className="tako-btn tako-btn-orange w-full disabled:opacity-50"
                  style={{ padding: '10px', fontSize: '11px' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isMergingPdfs ? 'animate-spin' : ''}`} />
                  {isMergingPdfs ? 'MERGING...' : 'COMBINE ALL INTO 1 PDF'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {mergedPdfResult ? (
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <span className="font-bold">// MERGED_RESULT</span>
                  <span className="tako-badge-orange">{mergedPdfResult.pageCount} PAGES</span>
                </div>
                <div className="p-8 text-center space-y-4 bg-white">
                  <div className="w-14 h-14 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                    <Check className="w-7 h-7 stroke-[3]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold uppercase text-black">
                      MERGE SUCCESSFUL
                    </h3>
                    <p className="text-xs font-mono text-stone-500 mt-1">
                      Combined into a single paginated document ({formatFileSize(mergedPdfResult.blob.size)})
                    </p>
                  </div>
                  <a
                    href={mergedPdfResult.url}
                    download={`merged_document_${Date.now()}.pdf`}
                    className="tako-btn tako-btn-black inline-flex"
                    style={{ padding: '10px 20px', fontSize: '12px' }}
                  >
                    <Download className="w-4 h-4" />
                    DOWNLOAD MERGED PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Queue 2 or more PDFs on the left and click &quot;COMBINE ALL INTO 1 PDF&quot; to execute.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* [7] SPLIT PDF */}
      {/* ========================================================= */}
      {mode === 'split-pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <input
              ref={splitInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfForSplit(f);
                  setSplitResults([]);
                }
              }}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// SPLIT_SETTINGS</span>
                <span className="text-[10px] text-stone-500 font-bold">SEGMENT ENGINE</span>
              </div>

              <div className="p-5 space-y-4 bg-white">
                <div
                  onClick={() => splitInputRef.current?.click()}
                  className="tako-dropzone p-6 space-y-2 text-center"
                >
                  <Split className="w-8 h-8 text-[#ff5500] mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase text-black">
                    {pdfForSplit ? pdfForSplit.name : 'SELECT PDF TO SPLIT'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {pdfForSplit ? formatFileSize(pdfForSplit.size) : 'Upload any document'}
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <span className="tako-label block">SPLIT_METHOD:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSplitMode('all_pages')}
                      className={`tako-btn ${splitMode === 'all_pages' ? 'tako-btn-orange' : 'bg-white'}`}
                      style={{ padding: '6px', fontSize: '10px' }}
                    >
                      Extract Every Page
                    </button>
                    <button
                      onClick={() => setSplitMode('ranges')}
                      className={`tako-btn ${splitMode === 'ranges' ? 'tako-btn-orange' : 'bg-white'}`}
                      style={{ padding: '6px', fontSize: '10px' }}
                    >
                      Custom Ranges
                    </button>
                  </div>

                  {splitMode === 'ranges' && (
                    <div className="space-y-1 pt-1">
                      <label className="tako-label-muted block">PAGE_RANGES (e.g. 1-2, 4):</label>
                      <input
                        type="text"
                        value={splitRanges}
                        onChange={(e) => setSplitRanges(e.target.value)}
                        className="tako-input"
                        placeholder="1-3, 5, 8-10"
                      />
                    </div>
                  )}
                </div>

                {pdfForSplit && (
                  <button
                    onClick={handleRunSplit}
                    disabled={isSplittingPdf}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSplittingPdf ? 'animate-spin' : ''}`} />
                    {isSplittingPdf ? 'EXTRACTING...' : 'RUN SPLIT OPERATION'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {splitResults.length > 0 ? (
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <span className="font-bold">// EXTRACTED_SEGMENTS</span>
                  <button
                    onClick={handleDownloadAllSplitZip}
                    className="tako-btn tako-btn-black"
                    style={{ padding: '3px 8px', fontSize: '10px' }}
                  >
                    <Archive className="w-3 h-3" />
                    DOWNLOAD ALL (ZIP)
                  </button>
                </div>

                <div className="p-4 divide-y divide-stone-200 max-h-96 overflow-y-auto bg-white font-mono text-xs">
                  {splitResults.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-black">{item.fileName}</p>
                        <p className="text-[10px] text-stone-500">
                          {item.pageCount} page(s) · {formatFileSize(item.blob.size)}
                        </p>
                      </div>
                      <a
                        href={item.url}
                        download={item.fileName}
                        className="tako-btn tako-btn-orange"
                        style={{ padding: '4px 10px', fontSize: '10px' }}
                      >
                        <Download className="w-3 h-3" />
                        SAVE
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Select a PDF on the left and click &quot;RUN SPLIT OPERATION&quot; to export individual or ranged documents.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* [8] ROTATE PDF */}
      {/* ========================================================= */}
      {mode === 'rotate-pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <input
              ref={rotateInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfForRotate(f);
                  setRotateResult(null);
                }
              }}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// ROTATION_PARAMETERS</span>
                <span className="text-[10px] text-stone-500 font-bold">ANGLE SPEC</span>
              </div>

              <div className="p-5 space-y-4 bg-white">
                <div
                  onClick={() => rotateInputRef.current?.click()}
                  className="tako-dropzone p-6 space-y-2 text-center"
                >
                  <RotateCw className="w-8 h-8 text-[#ff5500] mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase text-black">
                    {pdfForRotate ? pdfForRotate.name : 'SELECT PDF TO ROTATE'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {pdfForRotate ? formatFileSize(pdfForRotate.size) : 'Upload document'}
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <span className="tako-label block">CLOCKWISE_ROTATION:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[90, 180, 270].map((angle) => (
                      <button
                        key={angle}
                        onClick={() => setRotationAngle(angle)}
                        className={`tako-btn ${rotationAngle === angle ? 'tako-btn-orange' : 'bg-white'}`}
                        style={{ padding: '6px', fontSize: '11px' }}
                      >
                        +{angle}°
                      </button>
                    ))}
                  </div>

                  <span className="tako-label block pt-2">APPLY_SCOPE:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setRotateScope('all')}
                      className={`tako-btn ${rotateScope === 'all' ? 'tako-btn-orange' : 'bg-white'}`}
                      style={{ padding: '6px', fontSize: '10px' }}
                    >
                      All Pages
                    </button>
                    <button
                      onClick={() => setRotateScope('specific')}
                      className={`tako-btn ${rotateScope === 'specific' ? 'tako-btn-orange' : 'bg-white'}`}
                      style={{ padding: '6px', fontSize: '10px' }}
                    >
                      Specific Page
                    </button>
                  </div>

                  {rotateScope === 'specific' && (
                    <div className="space-y-1 pt-1">
                      <label className="tako-label-muted block">TARGET_PAGE_NUMBER:</label>
                      <input
                        type="number"
                        min="1"
                        value={specificPageNum}
                        onChange={(e) => setSpecificPageNum(parseInt(e.target.value, 10) || 1)}
                        className="tako-input"
                      />
                    </div>
                  )}
                </div>

                {pdfForRotate && (
                  <button
                    onClick={handleRunRotate}
                    disabled={isRotatingPdf}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRotatingPdf ? 'animate-spin' : ''}`} />
                    {isRotatingPdf ? 'ROTATING...' : 'APPLY ROTATION & SAVE'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {rotateResult ? (
              <div className="tako-panel p-8 text-center space-y-4 bg-white">
                <div className="w-14 h-14 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                  <RotateCw className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase text-black">
                    ROTATION APPLIED (+{rotationAngle}°)
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mt-1">
                    Document re-indexed with new orientation headers
                  </p>
                </div>
                <a
                  href={rotateResult.url}
                  download={`rotated_${Date.now()}.pdf`}
                  className="tako-btn tako-btn-black inline-flex"
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD ROTATED PDF
                </a>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Select a PDF, configure the degree angle, and click &quot;APPLY ROTATION &amp; SAVE&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* [9] REORDER & DELETE PAGES */}
      {/* ========================================================= */}
      {mode === 'organize-pdf' && (
        <div className="space-y-6">
          <input
            ref={organizeInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handlePdfForOrganizeSelect(f);
            }}
          />

          <div className="tako-panel p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs bg-white">
            <button
              onClick={() => organizeInputRef.current?.click()}
              className="tako-btn"
              style={{ padding: '6px 14px', fontSize: '11px' }}
            >
              <Upload className="w-3.5 h-3.5 text-[#ff5500]" />
              {pdfForOrganize ? 'CHANGE PDF' : 'SELECT PDF TO REORDER'}
            </button>

            <div className="flex items-center gap-3">
              {pageOrderList.length > 0 && (
                <button
                  onClick={handleRunOrganize}
                  disabled={isOrganizingPdf}
                  className="tako-btn tako-btn-orange"
                  style={{ padding: '6px 16px', fontSize: '11px' }}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isOrganizingPdf ? 'animate-spin' : ''}`} />
                  {isOrganizingPdf ? 'PROCESSING...' : `SAVE ORDER (${pageOrderList.length} PAGES)`}
                </button>
              )}

              {organizeResult && (
                <a
                  href={organizeResult.url}
                  download={`reordered_${Date.now()}.pdf`}
                  className="tako-btn tako-btn-black"
                  style={{ padding: '6px 16px', fontSize: '11px' }}
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD NEW PDF
                </a>
              )}
            </div>
          </div>

          {!pdfForOrganize ? (
            <div
              onClick={() => organizeInputRef.current?.click()}
              className="tako-dropzone p-12 text-center space-y-2"
            >
              <Sliders className="w-10 h-10 text-[#ff5500] mx-auto" />
              <p className="text-xs font-mono font-bold uppercase text-black">
                SELECT PDF TO VISUALLY REORGANIZE
              </p>
              <p className="text-[10px] font-mono text-stone-500">
                Move pages up or down, delete unwanted sheets, and export a clean document.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
              {pageOrderList.map((originalIdx, currentIdx) => (
                <div key={currentIdx} className="tako-panel p-2.5 text-center space-y-2 bg-white">
                  <div className="aspect-[3/4] border-2 border-black bg-stone-50 flex items-center justify-center">
                    <span className="text-2xl font-black text-stone-800">P.{originalIdx + 1}</span>
                  </div>
                  <div className="text-[10px] font-bold text-black">
                    SLOT #{currentIdx + 1}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleMoveOrganizePage(currentIdx, 'up')}
                      disabled={currentIdx === 0}
                      className="p-1 border border-black hover:bg-stone-100 disabled:opacity-20"
                      title="Move Left"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveOrganizePage(currentIdx, 'down')}
                      disabled={currentIdx === pageOrderList.length - 1}
                      className="p-1 border border-black hover:bg-stone-100 disabled:opacity-20"
                      title="Move Right"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrganizePage(currentIdx)}
                      className="p-1 border border-black hover:bg-red-600 hover:text-white text-stone-600"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* [10] WATERMARK PDF */}
      {/* ========================================================= */}
      {mode === 'watermark-pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <input
              ref={watermarkInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfForWatermark(f);
                  setWatermarkResult(null);
                }
              }}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// WATERMARK_ATTRIBUTES</span>
                <span className="text-[10px] text-stone-500 font-bold">STAMP ENGINE</span>
              </div>

              <div className="p-5 space-y-4 bg-white">
                <div
                  onClick={() => watermarkInputRef.current?.click()}
                  className="tako-dropzone p-6 space-y-2 text-center"
                >
                  <Type className="w-8 h-8 text-[#ff5500] mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase text-black">
                    {pdfForWatermark ? pdfForWatermark.name : 'SELECT PDF TO WATERMARK'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {pdfForWatermark ? formatFileSize(pdfForWatermark.size) : 'Upload any document'}
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="tako-label block mb-1">STAMP_TEXT:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="tako-input font-bold"
                      placeholder="CONFIDENTIAL, DRAFT, APPROVED..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="tako-label">OPACITY ({Math.round(watermarkOpacity * 100)}%):</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="accent-[#ff5500] w-full"
                    />
                  </div>

                  <div>
                    <span className="tako-label block mb-1">STAMP_COLOR:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={watermarkColor}
                        onChange={(e) => setWatermarkColor(e.target.value)}
                        className="w-7 h-7 border-2 border-black cursor-pointer"
                        style={{ borderRadius: 0, padding: 0 }}
                      />
                      <span className="text-xs font-bold">{watermarkColor}</span>
                    </div>
                  </div>
                </div>

                {pdfForWatermark && (
                  <button
                    onClick={handleRunWatermark}
                    disabled={isWatermarkingPdf}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isWatermarkingPdf ? 'animate-spin' : ''}`} />
                    {isWatermarkingPdf ? 'STAMPING...' : 'APPLY WATERMARK ACROSS PAGES'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {watermarkResult ? (
              <div className="tako-panel p-8 text-center space-y-4 bg-white">
                <div className="w-14 h-14 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                  <Type className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase text-black">
                    WATERMARK STAMPED SUCCESSFULLY
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mt-1">
                    Diagonal &quot;{watermarkText}&quot; layer embedded across all document pages
                  </p>
                </div>
                <a
                  href={watermarkResult.url}
                  download={`watermarked_${Date.now()}.pdf`}
                  className="tako-btn tako-btn-black inline-flex"
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD WATERMARKED PDF
                </a>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Select a PDF, specify your watermark string and opacity, and click &quot;APPLY WATERMARK&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* [11] PAGE NUMBERS */}
      {/* ========================================================= */}
      {mode === 'page-numbers-pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <input
              ref={pageNumbersInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfForPageNumbers(f);
                  setPageNumbersResult(null);
                }
              }}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// PAGINATION_SETTINGS</span>
                <span className="text-[10px] text-stone-500 font-bold">INDEX STAMP</span>
              </div>

              <div className="p-5 space-y-4 bg-white">
                <div
                  onClick={() => pageNumbersInputRef.current?.click()}
                  className="tako-dropzone p-6 space-y-2 text-center"
                >
                  <FileDown className="w-8 h-8 text-[#ff5500] mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase text-black">
                    {pdfForPageNumbers ? pdfForPageNumbers.name : 'SELECT PDF TO NUMBER'}
                  </p>
                  <p className="text-[10px] font-mono text-stone-500">
                    {pdfForPageNumbers ? formatFileSize(pdfForPageNumbers.size) : 'Upload any document'}
                  </p>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="tako-label block mb-1">NUMERATION_FORMAT:</label>
                    <select
                      value={numberFormat}
                      onChange={(e) => setNumberFormat(e.target.value as any)}
                      className="tako-input font-bold"
                    >
                      <option value="page_of_total">Page X of Y (e.g. Page 1 of 12)</option>
                      <option value="simple">X / Y (e.g. 1 / 12)</option>
                      <option value="brackets">[ X ] (e.g. [ 1 ])</option>
                    </select>
                  </div>

                  <div>
                    <label className="tako-label block mb-1">PLACEMENT_POSITION:</label>
                    <select
                      value={numberPosition}
                      onChange={(e) => setNumberPosition(e.target.value as any)}
                      className="tako-input font-bold"
                    >
                      <option value="bottom_center">Bottom Center</option>
                      <option value="bottom_right">Bottom Right</option>
                      <option value="top_right">Top Right</option>
                    </select>
                  </div>
                </div>

                {pdfForPageNumbers && (
                  <button
                    onClick={handleRunPageNumbers}
                    disabled={isAddingPageNumbers}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAddingPageNumbers ? 'animate-spin' : ''}`} />
                    {isAddingPageNumbers ? 'INDEXING...' : 'APPLY PAGE NUMBERS & SAVE'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            {pageNumbersResult ? (
              <div className="tako-panel p-8 text-center space-y-4 bg-white">
                <div className="w-14 h-14 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase text-black">
                    PAGINATION COMPLETED
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mt-1">
                    Sequential page numbers stamped across document
                  </p>
                </div>
                <a
                  href={pageNumbersResult.url}
                  download={`paginated_${Date.now()}.pdf`}
                  className="tako-btn tako-btn-black inline-flex"
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD PAGINATED PDF
                </a>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Select a PDF, choose your numbering format and position, and click &quot;APPLY PAGE NUMBERS&quot;.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* [12] SIGN PDF */}
      {/* ========================================================= */}
      {mode === 'sign-pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <input
              ref={signInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfForSign(f);
                  setSignResult(null);
                }
              }}
            />

            <div className="tako-panel overflow-hidden">
              <div className="tako-titlebar">
                <span className="font-bold">// SIGNATURE_CANVAS</span>
                <button
                  onClick={clearSignatureCanvas}
                  className="tako-btn"
                  style={{ padding: '2px 8px', fontSize: '10px' }}
                >
                  CLEAR PAD
                </button>
              </div>

              <div className="p-4 space-y-4 bg-white">
                <div
                  onClick={() => signInputRef.current?.click()}
                  className="tako-dropzone p-4 space-y-1 text-center"
                >
                  <FileSignature className="w-6 h-6 text-[#ff5500] mx-auto" />
                  <p className="text-xs font-mono font-bold uppercase text-black">
                    {pdfForSign ? pdfForSign.name : 'CLICK TO SELECT PDF TO SIGN'}
                  </p>
                </div>

                <div>
                  <span className="tako-label block mb-1">DRAW YOUR SIGNATURE:</span>
                  <div className="border-2 border-black bg-stone-50 p-1">
                    <canvas
                      ref={signatureCanvasRef}
                      width={450}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-32 bg-white cursor-crosshair border border-stone-200"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-stone-500 mt-1 block">
                    Use mouse or touch screen to draw your signature in the box above.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                  <div>
                    <label className="tako-label-muted block mb-1">PAGE #:</label>
                    <input
                      type="number"
                      min="1"
                      value={signTargetPage}
                      onChange={(e) => setSignTargetPage(parseInt(e.target.value, 10) || 1)}
                      className="tako-input"
                    />
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">X OFFSET:</label>
                    <input
                      type="number"
                      value={signPositionX}
                      onChange={(e) => setSignPositionX(parseInt(e.target.value, 10) || 60)}
                      className="tako-input"
                    />
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">Y OFFSET:</label>
                    <input
                      type="number"
                      value={signPositionY}
                      onChange={(e) => setSignPositionY(parseInt(e.target.value, 10) || 60)}
                      className="tako-input"
                    />
                  </div>
                </div>

                {pdfForSign && (
                  <button
                    onClick={handleRunSign}
                    disabled={isSigningPdf}
                    className="tako-btn tako-btn-orange w-full"
                    style={{ padding: '10px', fontSize: '11px' }}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSigningPdf ? 'animate-spin' : ''}`} />
                    {isSigningPdf ? 'STAMPING...' : 'EMBED SIGNATURE & SAVE PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            {signResult ? (
              <div className="tako-panel p-8 text-center space-y-4 bg-white">
                <div className="w-14 h-14 mx-auto border-2 border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                  <FileSignature className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-bold uppercase text-black">
                    SIGNATURE STAMPED
                  </h3>
                  <p className="text-xs font-mono text-stone-500 mt-1">
                    Signature graphic stamped onto Page #{signTargetPage}
                  </p>
                </div>
                <a
                  href={signResult.url}
                  download={`signed_${Date.now()}.pdf`}
                  className="tako-btn tako-btn-black inline-flex"
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  <Download className="w-4 h-4" />
                  DOWNLOAD SIGNED PDF
                </a>
              </div>
            ) : (
              <div className="tako-panel p-16 text-center font-mono text-xs text-stone-500">
                Upload your document on the left, draw your signature on the pad, and click &quot;EMBED SIGNATURE &amp; SAVE PDF&quot;.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
