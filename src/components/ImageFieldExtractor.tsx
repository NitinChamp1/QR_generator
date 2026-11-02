'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Upload,
  Sparkles,
  FileText,
  CreditCard,
  Receipt,
  Plus,
  Trash2,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Eye,
  Sliders,
  CheckCircle2,
  Smartphone,
  Globe,
  Mail,
  DollarSign,
  Calendar,
} from 'lucide-react';
import { ExtractedField, ExtractionResult } from '@/types';
import { runClientOCR, OCRProgress } from '@/utils/ocr';
import { formatFieldsToPayload } from '@/utils/qrPayloads';

interface ImageFieldExtractorProps {
  onSendToQRStudio: (payload: string, type: 'vcard' | 'text' | 'json' | 'url') => void;
}

export const ImageFieldExtractor: React.FC<ImageFieldExtractorProps> = ({ onSendToQRStudio }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ocrProgress, setOcrProgress] = useState<OCRProgress | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [qrFormat, setQrFormat] = useState<'vcard' | 'text' | 'json' | 'url'>('vcard');
  const [copied, setCopied] = useState<boolean>(false);
  const [showRawText, setShowRawText] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    processImage(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setOcrProgress({ status: 'Starting OCR engine...', progress: 5 });

    try {
      const res = await runClientOCR(file, (prog) => {
        setOcrProgress(prog);
      });

      setResult(res);

      // Auto-set the best QR format based on detected type
      if (res.detectedType === 'business_card') {
        setQrFormat('vcard');
      } else if (res.detectedType === 'receipt_invoice') {
        setQrFormat('text');
      } else {
        const hasUrl = res.fields.some((f) => f.category === 'link');
        setQrFormat(hasUrl ? 'url' : 'text');
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to process image: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setOcrProgress(null);
    }
  };

  const handleFieldChange = (id: string, key: string, value: string) => {
    if (!result) return;
    setResult({
      ...result,
      fields: result.fields.map((f) => (f.id === id ? { ...f, key, value } : f)),
    });
  };

  const handleToggleField = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      fields: result.fields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)),
    });
  };

  const handleDeleteField = (id: string) => {
    if (!result) return;
    setResult({
      ...result,
      fields: result.fields.filter((f) => f.id !== id),
    });
  };

  const handleAddField = () => {
    if (!result) return;
    const newField: ExtractedField = {
      id: `field-${Date.now()}`,
      key: 'Custom Field',
      value: '',
      category: 'general',
      confidence: 1,
      enabled: true,
    };
    setResult({
      ...result,
      fields: [...result.fields, newField],
    });
  };

  // Helper to load sample test images directly
  const loadSample = async (type: 'card' | 'receipt') => {
    // Generate sample image on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'card') {
      // Draw modern business card
      const grad = ctx.createLinearGradient(0, 0, 700, 400);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#312e81');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 700, 400);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('Alex Morgan', 60, 90);

      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Chief Technology Officer', 60, 125);
      ctx.fillText('NovaScale Technologies Inc.', 60, 155);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '20px sans-serif';
      ctx.fillText('Phone: +1 (555) 234-5678', 60, 220);
      ctx.fillText('Email: alex.morgan@novascale.io', 60, 260);
      ctx.fillText('Website: https://novascale.io', 60, 300);
      ctx.fillText('Location: 100 Innovation Way, San Francisco, CA', 60, 340);
    } else {
      // Draw receipt
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 700, 400);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 26px monospace';
      ctx.fillText('BLUE CAFE & BISTRO', 200, 60);

      ctx.font = '16px monospace';
      ctx.fillText('Receipt #: INV-84920', 60, 110);
      ctx.fillText('Date: Nov 02, 2026', 60, 140);
      ctx.fillText('------------------------------------------------', 60, 170);
      ctx.fillText('2x Cappuccino Grande              $ 11.00', 60, 200);
      ctx.fillText('1x Avocado Sourdough Toast        $ 14.50', 60, 230);
      ctx.fillText('1x Berry Acai Bowl                $ 12.00', 60, 260);
      ctx.fillText('------------------------------------------------', 60, 290);
      ctx.font = 'bold 20px monospace';
      ctx.fillText('Total Amount:                     $ 37.50', 60, 330);
      ctx.font = '14px monospace';
      ctx.fillText('Tax (8.5%): $3.19 | Card Ending: ****4242', 60, 365);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${type}_sample.png`, { type: 'image/png' });
        handleFileSelect(file);
      }
    }, 'image/png');
  };

  const currentPayload = result ? formatFieldsToPayload(result.fields, qrFormat) : '';

  const handleCopyPayload = () => {
    if (!currentPayload) return;
    navigator.clipboard.writeText(currentPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: ExtractedField['category']) => {
    switch (category) {
      case 'contact':
        return <Smartphone className="w-3.5 h-3.5 text-blue-500" />;
      case 'link':
        return <Globe className="w-3.5 h-3.5 text-emerald-500" />;
      case 'financial':
        return <DollarSign className="w-3.5 h-3.5 text-amber-500" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Image Data & Fields Extractor ➡️ QR Code
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
            Upload an image of a business card, invoice, receipt, document, or scan. We automatically
            detect, isolate key fields (name, phone, email, amount, links), and compile them directly into
            a scannable QR code!
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="text-zinc-500 dark:text-zinc-400 mr-2 flex items-center">
              Quick Test Samples:
            </span>
            <button
              onClick={() => loadSample('card')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-all font-medium shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
              Load Business Card Demo
            </button>
            <button
              onClick={() => loadSample('receipt')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 transition-all font-medium shadow-xs"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              Load Receipt Demo
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Image Viewer (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              imagePreview
                ? 'border-indigo-500/40 bg-zinc-50/50 dark:bg-zinc-900/50'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 hover:bg-indigo-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />

            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 max-h-72 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-72 w-auto object-contain mx-auto"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="truncate max-w-[200px] font-medium text-zinc-800 dark:text-zinc-200">
                    {selectedFile?.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Change
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Click or Drag Image Here
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Supports PNG, JPEG, WEBP, BMP, GIF
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* OCR Processing State */}
          {isProcessing && ocrProgress && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {ocrProgress.status}
                </span>
                <span>{ocrProgress.progress}%</span>
              </div>
              <div className="w-full bg-indigo-200 dark:bg-indigo-950 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 transition-all duration-300"
                  style={{ width: `${Math.max(10, ocrProgress.progress)}%` }}
                />
              </div>
            </div>
          )}

          {/* Raw Text Toggle */}
          {result && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900/50">
              <button
                onClick={() => setShowRawText(!showRawText)}
                className="w-full flex items-center justify-between text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  {showRawText ? 'Hide Raw OCR Text' : 'View Full Extracted OCR Text'}
                </span>
                <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {result.rawText.length} chars
                </span>
              </button>
              {showRawText && (
                <pre className="mt-3 p-3 bg-white dark:bg-zinc-950 rounded-lg text-[11px] font-mono text-zinc-700 dark:text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap border border-zinc-200 dark:border-zinc-800">
                  {result.rawText || 'No text extracted.'}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Extracted Fields & QR Bridge (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Type Badge & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
                <div>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Detected Format
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-bold text-zinc-900 dark:text-white capitalize">
                      {result.detectedType.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {result.fields.length} Fields Found
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleAddField}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Field
                </button>
              </div>

              {/* Editable Fields Table */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Include in QR</span>
                  <span>Field & Value</span>
                  <span>Action</span>
                </div>

                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-80 overflow-y-auto">
                  {result.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-3 flex items-center gap-3 transition-colors ${
                        field.enabled ? 'bg-transparent' : 'opacity-40 bg-zinc-50/30'
                      }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={() => handleToggleField(field.id)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />

                      {/* Icon */}
                      <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                        {getCategoryIcon(field.category)}
                      </div>

                      {/* Key & Value Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-grow">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => handleFieldChange(field.id, e.target.value, field.value)}
                          className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Field Name"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, field.key, e.target.value)}
                          className="sm:col-span-2 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Value"
                        />
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Payload Output & Live QR Bridge */}
              <div className="bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-sm font-bold text-zinc-900 dark:text-white">
                      QR Code Output Format
                    </span>
                  </div>

                  <div className="flex rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5 text-xs font-semibold">
                    <button
                      onClick={() => setQrFormat('vcard')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        qrFormat === 'vcard'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      vCard (Contact)
                    </button>
                    <button
                      onClick={() => setQrFormat('text')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        qrFormat === 'text'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      Clean Text
                    </button>
                    <button
                      onClick={() => setQrFormat('json')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        qrFormat === 'json'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => setQrFormat('url')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        qrFormat === 'url'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {/* QR Preview & Payload Content */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  {/* QR Preview Box */}
                  <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    {currentPayload ? (
                      <div className="p-2 bg-white rounded-lg shadow-xs">
                        <QRCodeSVG
                          value={currentPayload}
                          size={130}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    ) : (
                      <div className="w-[130px] h-[130px] flex items-center justify-center text-xs text-zinc-400 border border-dashed rounded-lg">
                        Select fields
                      </div>
                    )}
                    <span className="mt-2 text-[11px] font-medium text-zinc-500">
                      Live QR Code Preview
                    </span>
                  </div>

                  {/* Actions & Summary */}
                  <div className="sm:col-span-8 space-y-3">
                    <div className="relative">
                      <pre className="p-3 bg-white dark:bg-zinc-950 rounded-xl text-[11px] font-mono text-zinc-700 dark:text-zinc-300 max-h-32 overflow-y-auto border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap">
                        {currentPayload || 'No payload generated. Please enable at least one field.'}
                      </pre>
                      <button
                        onClick={handleCopyPayload}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-600 dark:text-zinc-300 transition-colors"
                        title="Copy QR Data"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => onSendToQRStudio(currentPayload, qrFormat)}
                        className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                      >
                        Customize & Download in QR Studio
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center bg-white dark:bg-zinc-900/50 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-zinc-800 text-indigo-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  No Image Selected Yet
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Upload an image on the left or click one of the sample buttons to extract structured
                  contact details, invoice amounts, numbers, and URLs right into a QR code!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
