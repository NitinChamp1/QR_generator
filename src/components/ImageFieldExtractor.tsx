'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Upload,
  FileText,
  CreditCard,
  Receipt,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  ArrowUpRight,
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
    setOcrProgress({ status: 'INIT_OCR_CORE', progress: 5 });

    try {
      const res = await runClientOCR(file, (prog) => {
        setOcrProgress(prog);
      });

      setResult(res);

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
      alert('Error parsing image: ' + (err.message || 'Unknown error'));
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
      key: 'CUSTOM_FIELD',
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

  const loadSample = async (type: 'card' | 'receipt') => {
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'card') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 700, 400);

      // Card border
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 3;
      ctx.strokeRect(15, 15, 670, 370);

      // Orange header band
      ctx.fillStyle = '#ff5500';
      ctx.fillRect(15, 15, 670, 8);

      ctx.fillStyle = '#111111';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Alex Morgan', 50, 80);

      ctx.fillStyle = '#ff5500';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('CHIEF TECHNOLOGY OFFICER // NOVASCALE', 50, 115);

      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(50, 145);
      ctx.lineTo(650, 145);
      ctx.stroke();

      ctx.fillStyle = '#111111';
      ctx.font = '16px monospace';
      ctx.fillText('TEL: +1 (555) 234-5678', 50, 190);
      ctx.fillText('EMAIL: alex.morgan@novascale.io', 50, 230);
      ctx.fillText('WEB: https://novascale.io', 50, 270);
      ctx.fillText('ADDR: 100 Innovation Way, San Francisco, CA', 50, 310);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 700, 400);

      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 15, 670, 370);

      ctx.fillStyle = '#ff5500';
      ctx.font = 'bold 22px monospace';
      ctx.fillText('--- CENTRAL CAFE & ROASTERY ---', 140, 55);

      ctx.fillStyle = '#111111';
      ctx.font = '15px monospace';
      ctx.fillText('Receipt #: INV-84920', 60, 95);
      ctx.fillText('Date: Nov 02, 2026', 60, 125);
      ctx.fillText('-----------------------------------------------------', 60, 155);
      ctx.fillText('2x Cold Brew Latte                     $ 11.00', 60, 190);
      ctx.fillText('1x Sourdough Toast                     $ 14.50', 60, 220);
      ctx.fillText('1x Acai Bowl                           $ 12.00', 60, 250);
      ctx.fillText('-----------------------------------------------------', 60, 280);
      ctx.fillStyle = '#ff5500';
      ctx.font = 'bold 18px monospace';
      ctx.fillText('TOTAL AMOUNT:                          $ 37.50', 60, 320);
      ctx.fillStyle = '#555555';
      ctx.font = '13px monospace';
      ctx.fillText('TAX: $3.19 | PAYMENT: CARD ****4242 | AUTH: 99182', 60, 355);
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

  return (
    <div className="space-y-6">
      {/* TAKO Hero Banner */}
      <div className="tako-panel p-6 bg-white space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold text-[#ff5500] uppercase tracking-wider block">
              [ PIPELINE // 01 · DATA_EXTRACTION ]
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight uppercase text-black mt-1">
              FIELD<span className="text-[#ff5500]">EXTRACTOR</span>
            </h1>
            <p className="mt-1 text-xs font-mono text-stone-600 max-w-2xl">
              EXTRACT · STRUCTURE · ENCODE — PARSE CONTACTS, INVOICES &amp; ATTRIBUTES STRAIGHT TO QR.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadSample('card')}
              className="tako-btn text-xs py-1.5 px-3 bg-white"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#ff5500]" />
              Demo Card
            </button>
            <button
              onClick={() => loadSample('receipt')}
              className="tako-btn text-xs py-1.5 px-3 bg-white"
            >
              <Receipt className="w-3.5 h-3.5 text-[#ff5500]" />
              Demo Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="tako-panel overflow-hidden">
            <div className="tako-titlebar">
              <span className="font-bold">// SOURCE_IMAGE</span>
              <div className="w-4 h-4 border border-black flex items-center justify-center text-[9px] font-bold">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-4 space-y-4 bg-white">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed border-black p-6 text-center cursor-pointer transition-all ${
                  imagePreview ? 'bg-stone-50/50' : 'bg-white hover:bg-stone-50'
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
                  <div className="space-y-3">
                    <div className="border border-black max-h-64 flex items-center justify-center bg-white p-1">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-60 w-auto object-contain mx-auto"
                      />
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="truncate max-w-[200px] font-bold text-black">
                        {selectedFile?.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="font-bold text-[#ff5500] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Change File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-12 h-12 mx-auto border border-black bg-[#ff5500] text-white flex items-center justify-center shadow-[2px_2px_0px_#111]">
                      <Upload className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold uppercase text-black">
                        DROP IMAGE HERE OR CLICK TO BROWSE
                      </p>
                      <p className="text-[10px] font-mono text-stone-500 mt-0.5">
                        PNG, JPG, WEBP, BMP, GIF
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* OCR Progress */}
              {isProcessing && ocrProgress && (
                <div className="tako-panel-sm p-3 bg-stone-50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-black">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff5500]" />
                      {ocrProgress.status}
                    </span>
                    <span className="text-[#ff5500]">{ocrProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-stone-200 border border-black h-2 overflow-hidden">
                    <div
                      className="bg-[#ff5500] h-full transition-all duration-150"
                      style={{ width: `${Math.max(10, ocrProgress.progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Raw OCR Text Toggle */}
              {result && (
                <div className="tako-panel-sm p-3 bg-stone-50">
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="w-full flex items-center justify-between text-xs font-mono font-bold text-black hover:text-[#ff5500]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {showRawText ? 'HIDE RAW OCR OUTPUT' : 'VIEW RAW OCR OUTPUT'}
                    </span>
                    <span className="tako-badge bg-white text-[10px]">
                      {result.rawText.length} BYTES
                    </span>
                  </button>
                  {showRawText && (
                    <pre className="mt-3 p-3 bg-white border border-black text-[11px] font-mono max-h-48 overflow-y-auto whitespace-pre-wrap text-black">
                      {result.rawText || 'No text content recognized.'}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Extracted Fields & QR Bridge (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Fields Table Window */}
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">// DETECTED_FIELDS</span>
                    <span className="tako-badge-orange text-[10px]">
                      {result.detectedType.toUpperCase()}
                    </span>
                    <span className="tako-badge bg-white text-black text-[10px]">
                      {result.fields.length} ITEMS
                    </span>
                  </div>

                  <button
                    onClick={handleAddField}
                    className="tako-btn text-[10px] py-0.5 px-2 bg-white hover:bg-stone-100"
                  >
                    <Plus className="w-3 h-3 text-[#ff5500]" />
                    ADD FIELD
                  </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 bg-stone-100 border-b border-black px-3 py-2 text-[11px] font-mono font-bold text-stone-700">
                  <span className="col-span-1 text-center">USE</span>
                  <span className="col-span-4">FIELD NAME</span>
                  <span className="col-span-6">VALUE</span>
                  <span className="col-span-1 text-right">DEL</span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-stone-200 max-h-80 overflow-y-auto bg-white">
                  {result.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`grid grid-cols-12 items-center px-3 py-2 gap-2 text-xs font-mono transition-colors ${
                        field.enabled ? 'bg-white' : 'bg-stone-50 opacity-60'
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={() => handleToggleField(field.id)}
                          className="w-3.5 h-3.5 rounded-none border-black accent-[#ff5500] cursor-pointer"
                        />
                      </div>

                      {/* Key */}
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => handleFieldChange(field.id, e.target.value, field.value)}
                          className="tako-input w-full py-1 text-xs font-bold"
                          placeholder="FIELD"
                        />
                      </div>

                      {/* Value */}
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, field.key, e.target.value)}
                          className="tako-input w-full py-1 text-xs"
                          placeholder="VALUE"
                        />
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                          title="Remove field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Payload & Live Matrix Bridge */}
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <span className="font-bold">// OUTPUT_BRIDGE_TO_QR</span>
                  <span className="text-[10px] text-stone-500">ISO/IEC 18004</span>
                </div>

                <div className="p-5 space-y-4 bg-white">
                  {/* Format Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-mono font-bold uppercase text-black">
                      Payload Encoding:
                    </span>

                    <div className="flex gap-1.5 font-mono">
                      {[
                        { id: 'vcard', label: 'vCard (.vcf)' },
                        { id: 'text', label: 'Plain Text' },
                        { id: 'json', label: 'JSON' },
                        { id: 'url', label: 'URL Link' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          onClick={() => setQrFormat(fmt.id as any)}
                          className={`tako-btn text-xs py-1 px-3 ${
                            qrFormat === fmt.id
                              ? 'tako-btn-orange font-black'
                              : 'bg-white text-black'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Preview & Output Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-2 border-t border-black">
                    {/* QR Preview Frame */}
                    <div className="sm:col-span-4 flex flex-col items-center">
                      <div className="border border-black p-2.5 bg-white shadow-[2px_2px_0px_#111]">
                        {currentPayload ? (
                          <QRCodeSVG
                            value={currentPayload}
                            size={120}
                            level="M"
                            includeMargin={false}
                          />
                        ) : (
                          <div className="w-[120px] h-[120px] flex items-center justify-center text-[10px] font-mono text-stone-400 border border-dashed border-stone-300">
                            NO DATA
                          </div>
                        )}
                      </div>
                      <span className="mt-2 text-[10px] font-mono font-bold text-[#ff5500] uppercase">
                        [ LIVE_PREVIEW ]
                      </span>
                    </div>

                    {/* Payload text + Transfer Button */}
                    <div className="sm:col-span-8 space-y-3">
                      <div className="relative">
                        <pre className="p-3 bg-stone-50 border border-black text-[11px] font-mono text-black max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {currentPayload || '// No fields active. Check boxes above.'}
                        </pre>
                        <button
                          onClick={handleCopyPayload}
                          className="absolute top-2 right-2 tako-btn text-[10px] py-0.5 px-2 bg-white"
                          title="Copy payload"
                        >
                          {copied ? (
                            <Check className="w-3 h-3 text-[#ff5500]" />
                          ) : (
                            <Copy className="w-3 h-3 text-black" />
                          )}
                        </button>
                      </div>

                      <button
                        onClick={() => onSendToQRStudio(currentPayload, qrFormat)}
                        className="tako-btn tako-btn-orange w-full text-xs py-2.5 font-bold"
                      >
                        <span>[ OPEN IN FULL QR STUDIO ➡️ ]</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="tako-panel p-12 text-center space-y-3 bg-white">
              <div className="w-12 h-12 mx-auto border border-black bg-stone-100 flex items-center justify-center shadow-[1.5px_1.5px_0px_#111]">
                <FileText className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-black">
                  WAITING_FOR_INPUT
                </h3>
                <p className="mt-1 text-xs font-mono text-stone-500 max-w-sm mx-auto">
                  Upload an image on the left or select a sample preset above to parse structured
                  data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
