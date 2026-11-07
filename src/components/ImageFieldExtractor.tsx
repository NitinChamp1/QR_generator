'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Upload,
  FileText,
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
      const res = await runClientOCR(file, (prog) => setOcrProgress(prog));
      setResult(res);
      if (res.detectedType === 'business_card') setQrFormat('vcard');
      else if (res.detectedType === 'receipt_invoice') setQrFormat('text');
      else {
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
    setResult({ ...result, fields: result.fields.map((f) => (f.id === id ? { ...f, key, value } : f)) });
  };

  const handleToggleField = (id: string) => {
    if (!result) return;
    setResult({ ...result, fields: result.fields.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)) });
  };

  const handleDeleteField = (id: string) => {
    if (!result) return;
    setResult({ ...result, fields: result.fields.filter((f) => f.id !== id) });
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
    setResult({ ...result, fields: [...result.fields, newField] });
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
      {/* Hero Banner */}
      <div className="tako-panel p-5 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#ff6e40] uppercase tracking-wider block">
              [ PIPELINE // 01 · DATA_EXTRACTION ]
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight uppercase text-[#1e3d59] mt-1">
              FIELD<span className="text-[#ff6e40]">EXTRACTOR</span>
            </h1>
            <p className="mt-1 text-[11px] font-mono text-[#1e3d59]/70 max-w-2xl">
              EXTRACT · STRUCTURE · ENCODE — PARSE CONTACTS, INVOICES &amp; ATTRIBUTES STRAIGHT TO QR.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="tako-badge font-mono text-[10px]">
              ENGINE: TESSERACT_WASM
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Image Upload (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="tako-panel overflow-hidden">
            <div className="tako-titlebar">
              <span className="font-bold">// SOURCE_IMAGE</span>
              <div className="w-5 h-5 border border-[#1e3d59] flex items-center justify-center bg-white">
                <ArrowUpRight className="w-3 h-3 text-[#1e3d59]" />
              </div>
            </div>

            <div className="p-4 space-y-4 bg-white">
              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`tako-dropzone p-6 text-center cursor-pointer ${imagePreview ? 'bg-[#f5f0e1]/30' : ''}`}
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
                    <div className="border-2 border-[#1e3d59] max-h-64 flex items-center justify-center bg-white p-1">
                      <img src={imagePreview} alt="Preview" className="max-h-60 w-auto object-contain mx-auto" />
                    </div>
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="truncate max-w-[200px] font-bold text-[#1e3d59]">{selectedFile?.name}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="font-bold text-[#ff6e40] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Change File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 space-y-3">
                    <div className="w-12 h-12 mx-auto border-2 border-[#1e3d59] bg-[#ff6e40] text-white flex items-center justify-center shadow-[2px_2px_0px_#1e3d59]">
                      <Upload className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div>
                      <p className="text-xs font-mono font-bold uppercase text-[#1e3d59]">DROP IMAGE HERE OR CLICK TO BROWSE</p>
                      <p className="text-[10px] font-mono text-[#1e3d59]/60 mt-0.5">PNG · JPG · WEBP · BMP</p>
                    </div>
                  </div>
                )}
              </div>

              {/* OCR Progress */}
              {isProcessing && ocrProgress && (
                <div className="tako-panel-sm p-3 bg-[#f5f0e1]/50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-[#1e3d59]">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff6e40]" />
                      {ocrProgress.status}
                    </span>
                    <span className="text-[#ff6e40]">{ocrProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-[#ece6d5] border border-[#1e3d59] h-2 overflow-hidden">
                    <div
                      className="bg-[#ff6e40] h-full transition-all duration-150"
                      style={{ width: `${Math.max(10, ocrProgress.progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Raw OCR Toggle */}
              {result && (
                <div className="tako-panel-sm p-3 bg-[#f5f0e1]/40">
                  <button
                    onClick={() => setShowRawText(!showRawText)}
                    className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#1e3d59] hover:text-[#ff6e40]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {showRawText ? 'HIDE RAW OCR OUTPUT' : 'VIEW RAW OCR OUTPUT'}
                    </span>
                    <span className="tako-badge">{result.rawText.length} BYTES</span>
                  </button>
                  {showRawText && (
                    <pre className="mt-3 p-3 bg-white border border-[#1e3d59] text-[11px] font-mono max-h-48 overflow-y-auto whitespace-pre-wrap text-[#1e3d59]">
                      {result.rawText || 'No text content recognized.'}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Extracted Fields + QR Bridge (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Fields Table */}
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">// DETECTED_FIELDS</span>
                    <span className="tako-badge-orange">{result.detectedType.toUpperCase()}</span>
                    <span className="tako-badge-gold">{result.fields.length} ITEMS</span>
                  </div>
                  <button onClick={handleAddField} className="tako-btn" style={{ padding: '2px 8px', fontSize: '10px' }}>
                    <Plus className="w-3 h-3 text-[#ff6e40]" />
                    ADD FIELD
                  </button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 bg-[#ece6d5] border-b-2 border-[#1e3d59] px-3 py-2 text-[11px] font-mono font-bold text-[#1e3d59] uppercase">
                  <span className="col-span-1 text-center">USE</span>
                  <span className="col-span-4">FIELD NAME</span>
                  <span className="col-span-6">VALUE</span>
                  <span className="col-span-1 text-right">DEL</span>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-[#1e3d59]/20 max-h-80 overflow-y-auto bg-white">
                  {result.fields.map((field) => (
                    <div
                      key={field.id}
                      className={`grid grid-cols-12 items-center px-3 py-2 gap-2 text-xs font-mono transition-colors ${field.enabled ? 'bg-white' : 'bg-[#f5f0e1]/40 opacity-60'}`}
                    >
                      <div className="col-span-1 flex justify-center">
                        <input
                          type="checkbox"
                          checked={field.enabled}
                          onChange={() => handleToggleField(field.id)}
                          className="w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={field.key}
                          onChange={(e) => handleFieldChange(field.id, e.target.value, field.value)}
                          className="tako-input py-1 text-xs font-bold"
                          placeholder="FIELD"
                        />
                      </div>
                      <div className="col-span-6">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => handleFieldChange(field.id, field.key, e.target.value)}
                          className="tako-input py-1 text-xs"
                          placeholder="VALUE"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-1 text-[#1e3d59]/40 hover:text-red-600 transition-colors"
                          title="Remove field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* QR Bridge */}
              <div className="tako-panel overflow-hidden">
                <div className="tako-titlebar">
                  <span className="font-bold">// OUTPUT_BRIDGE_TO_QR</span>
                  <span className="text-[10px] text-[#1e3d59]/70">ISO/IEC 18004</span>
                </div>

                <div className="p-5 space-y-4 bg-white">
                  {/* Format Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="tako-label">Payload Encoding:</span>
                    <div className="flex gap-1.5">
                      {[
                        { id: 'vcard', label: 'vCard (.vcf)' },
                        { id: 'text', label: 'Plain Text' },
                        { id: 'json', label: 'JSON' },
                        { id: 'url', label: 'URL Link' },
                      ].map((fmt) => (
                        <button
                          key={fmt.id}
                          onClick={() => setQrFormat(fmt.id as any)}
                          className={`tako-btn ${qrFormat === fmt.id ? 'tako-btn-orange' : ''}`}
                          style={{ padding: '3px 10px', fontSize: '10px' }}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* QR Preview & Output */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center pt-3 border-t-2 border-[#1e3d59]">
                    {/* QR Preview */}
                    <div className="sm:col-span-4 flex flex-col items-center">
                      <div className="border-2 border-[#1e3d59] p-2.5 bg-white shadow-[3px_3px_0px_#1e3d59]">
                        {currentPayload ? (
                          <QRCodeSVG value={currentPayload} size={120} level="M" includeMargin={false} />
                        ) : (
                          <div className="w-[120px] h-[120px] flex items-center justify-center text-[10px] font-mono text-[#1e3d59]/40 border border-dashed border-[#1e3d59]/40">
                            NO DATA
                          </div>
                        )}
                      </div>
                      <span className="mt-2 text-[10px] font-mono font-bold text-[#ff6e40] uppercase">[ LIVE_PREVIEW ]</span>
                    </div>

                    {/* Payload & Send */}
                    <div className="sm:col-span-8 space-y-3">
                      <div className="relative">
                        <pre className="p-3 bg-[#f5f0e1]/40 border-2 border-[#1e3d59] text-[11px] font-mono text-[#1e3d59] max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {currentPayload || '// No fields active. Check boxes above.'}
                        </pre>
                        <button
                          onClick={handleCopyPayload}
                          className="tako-btn absolute top-2 right-2"
                          style={{ padding: '2px 6px', fontSize: '10px' }}
                          title="Copy payload"
                        >
                          {copied ? <Check className="w-3 h-3 text-[#ff6e40]" /> : <Copy className="w-3 h-3 text-[#1e3d59]" />}
                        </button>
                      </div>

                      <button
                        onClick={() => onSendToQRStudio(currentPayload, qrFormat)}
                        className="tako-btn tako-btn-orange w-full"
                        style={{ padding: '10px', fontSize: '12px' }}
                      >
                        [ OPEN IN FULL QR STUDIO → ]
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="tako-panel p-16 text-center space-y-4">
              <div className="w-14 h-14 mx-auto border-2 border-[#1e3d59] bg-[#ece6d5] flex items-center justify-center shadow-[2px_2px_0px_#1e3d59]">
                <FileText className="w-7 h-7 text-[#1e3d59]" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold uppercase text-[#1e3d59]">WAITING_FOR_INPUT</h3>
                <p className="mt-1 text-xs font-mono text-[#1e3d59]/70 max-w-sm mx-auto">
                  Upload an image above to parse structured data directly to QR.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
