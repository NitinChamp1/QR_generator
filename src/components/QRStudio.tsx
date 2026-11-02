'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  Download,
  Copy,
  Check,
  Printer,
  Sparkles,
  Link as LinkIcon,
  FileText,
  Contact,
  Wifi,
  Mail,
  MessageSquare,
  Code,
  Image as ImageIcon,
  Palette,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { QRDataType, VCardData, WifiData } from '@/types';
import { formatVCard, formatWifi } from '@/utils/qrPayloads';

interface QRStudioProps {
  initialPayload?: string;
  initialType?: QRDataType;
}

export const QRStudio: React.FC<QRStudioProps> = ({
  initialPayload = '',
  initialType = 'url',
}) => {
  const [dataType, setDataType] = useState<QRDataType>(initialType);

  // Form states
  const [urlInput, setUrlInput] = useState<string>('https://example.com');
  const [textInput, setTextInput] = useState<string>('');
  const [vcardInput, setVcardInput] = useState<VCardData>({
    firstName: 'Alex',
    lastName: 'Morgan',
    organization: 'NovaScale Inc.',
    title: 'CTO',
    phone: '+1 555-234-5678',
    email: 'alex.morgan@novascale.io',
    website: 'https://novascale.io',
    address: 'San Francisco, CA',
    notes: 'Generated via OmniConvert QR',
  });
  const [wifiInput, setWifiInput] = useState<WifiData>({
    ssid: 'Home_HighSpeed_5G',
    password: '',
    encryption: 'WPA',
    hidden: false,
  });
  const [emailInput, setEmailInput] = useState({
    to: 'hello@example.com',
    subject: 'Inquiry',
    body: 'Hi, I would like to get in touch.',
  });
  const [smsInput, setSmsInput] = useState({
    phone: '+1 555-0199',
    message: 'Hello! Sent via QR code.',
  });
  const [jsonInput, setJsonInput] = useState<string>('{\n  "status": "success",\n  "app": "OmniConvert"\n}');

  // Customization states
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [qrSize, setQrSize] = useState<number>(280);
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(44);

  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle incoming initial payload from extractor
  useEffect(() => {
    if (initialPayload) {
      if (initialType === 'vcard') {
        setDataType('vcard');
        setTextInput(initialPayload);
      } else if (initialType === 'json') {
        setDataType('json');
        setJsonInput(initialPayload);
      } else if (initialType === 'url') {
        setDataType('url');
        setUrlInput(initialPayload);
      } else {
        setDataType('text');
        setTextInput(initialPayload);
      }
    }
  }, [initialPayload, initialType]);

  // Compute final QR string
  const getQRString = (): string => {
    switch (dataType) {
      case 'url':
        return urlInput.startsWith('http://') || urlInput.startsWith('https://')
          ? urlInput
          : `https://${urlInput}`;
      case 'text':
        return textInput || 'Sample Text';
      case 'vcard':
        // If coming directly from raw string, preserve it; otherwise format from structured state
        return initialPayload && initialType === 'vcard' && textInput === initialPayload
          ? initialPayload
          : formatVCard(vcardInput);
      case 'wifi':
        return formatWifi(wifiInput);
      case 'email':
        return `mailto:${emailInput.to}?subject=${encodeURIComponent(
          emailInput.subject
        )}&body=${encodeURIComponent(emailInput.body)}`;
      case 'sms':
        return `smsto:${smsInput.phone}:${smsInput.message}`;
      case 'json':
        return jsonInput;
      default:
        return urlInput;
    }
  };

  const qrString = getQRString();

  // Downloads
  const downloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    // Create a high-res canvas (1024x1024) for crisp export
    const exportCanvas = document.createElement('canvas');
    const scale = 1024 / canvas.width;
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, 1024, 1024);

    const a = document.createElement('a');
    a.download = `qrcode_${Date.now()}.png`;
    a.href = exportCanvas.toDataURL('image/png');
    a.click();
  };

  const downloadSVG = () => {
    const svg = document.getElementById('qr-svg-render');
    if (!svg) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.download = `qrcode_${Date.now()}.svg`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyImage = async () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard copy error:', err);
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const colorPresets = [
    { label: 'Onyx', hex: '#000000' },
    { label: 'Indigo', hex: '#4f46e5' },
    { label: 'Emerald', hex: '#059669' },
    { label: 'Violet', hex: '#7c3aed' },
    { label: 'Crimson', hex: '#dc2626' },
    { label: 'Ocean', hex: '#0284c7' },
    { label: 'Amber', hex: '#d97706' },
    { label: 'Rose', hex: '#e11d48' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-blue-500/10 border border-violet-500/20 rounded-2xl p-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-violet-600 dark:text-violet-400" />
          Advanced QR Code Studio
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 max-w-3xl leading-relaxed">
          Create high-definition, customizable QR codes for Websites, Contacts (vCard), Wi-Fi logins,
          Emails, and SMS. Customize colors, add your central brand logo, and download in vector SVG or high-res PNG!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Data & Types (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Data Type Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
            {[
              { id: 'url', label: 'Website / Link', icon: LinkIcon },
              { id: 'vcard', label: 'Contact (vCard)', icon: Contact },
              { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
              { id: 'text', label: 'Plain Text', icon: FileText },
              { id: 'email', label: 'Email Message', icon: Mail },
              { id: 'sms', label: 'SMS / Text', icon: MessageSquare },
              { id: 'json', label: 'JSON Data', icon: Code },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = dataType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDataType(tab.id as QRDataType)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Inputs based on Mode */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-xs">
            {dataType === 'url' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Target Website URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {dataType === 'text' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Text / Note Content
                </label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={5}
                  placeholder="Type any message, receipt info, note, or serial number..."
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {dataType === 'vcard' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={vcardInput.firstName}
                      onChange={(e) => setVcardInput({ ...vcardInput, firstName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={vcardInput.lastName}
                      onChange={(e) => setVcardInput({ ...vcardInput, lastName: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Mobile / Phone
                    </label>
                    <input
                      type="tel"
                      value={vcardInput.phone}
                      onChange={(e) => setVcardInput({ ...vcardInput, phone: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={vcardInput.email}
                      onChange={(e) => setVcardInput({ ...vcardInput, email: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Company / Organization
                    </label>
                    <input
                      type="text"
                      value={vcardInput.organization}
                      onChange={(e) => setVcardInput({ ...vcardInput, organization: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={vcardInput.title}
                      onChange={(e) => setVcardInput({ ...vcardInput, title: e.target.value })}
                      className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    Website
                  </label>
                  <input
                    type="url"
                    value={vcardInput.website}
                    onChange={(e) => setVcardInput({ ...vcardInput, website: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                    Office / Street Address
                  </label>
                  <input
                    type="text"
                    value={vcardInput.address}
                    onChange={(e) => setVcardInput({ ...vcardInput, address: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {dataType === 'wifi' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiInput.ssid}
                    onChange={(e) => setWifiInput({ ...wifiInput, ssid: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={wifiInput.password}
                    onChange={(e) => setWifiInput({ ...wifiInput, password: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Leave empty if open network"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mr-2">
                      Security:
                    </label>
                    <select
                      value={wifiInput.encryption}
                      onChange={(e) =>
                        setWifiInput({
                          ...wifiInput,
                          encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                        })
                      }
                      className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open)</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wifiInput.hidden}
                      onChange={(e) => setWifiInput({ ...wifiInput, hidden: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Hidden Network
                  </label>
                </div>
              </div>
            )}

            {dataType === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Recipient Email</label>
                  <input
                    type="email"
                    value={emailInput.to}
                    onChange={(e) => setEmailInput({ ...emailInput, to: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Subject Line</label>
                  <input
                    type="text"
                    value={emailInput.subject}
                    onChange={(e) => setEmailInput({ ...emailInput, subject: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Message Body</label>
                  <textarea
                    rows={3}
                    value={emailInput.body}
                    onChange={(e) => setEmailInput({ ...emailInput, body: e.target.value })}
                    className="w-full mt-1 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {dataType === 'sms' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Phone Number</label>
                  <input
                    type="tel"
                    value={smsInput.phone}
                    onChange={(e) => setSmsInput({ ...smsInput, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Message Text</label>
                  <textarea
                    rows={3}
                    value={smsInput.message}
                    onChange={(e) => setSmsInput({ ...smsInput, message: e.target.value })}
                    className="w-full mt-1 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {dataType === 'json' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Raw JSON Payload</label>
                <textarea
                  rows={5}
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full p-3 font-mono rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Styling & Color Customizer */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-500" />
              Design & Visual Customization
            </h3>

            {/* Colors */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pattern / Foreground Color
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-zinc-500 uppercase">{fgColor}</span>
                </div>
              </div>

              {/* Swatches */}
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.hex}
                    onClick={() => setFgColor(preset.hex)}
                    className={`w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110 ${
                      fgColor === preset.hex ? 'border-indigo-500 scale-105' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={preset.label}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Background Color
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-500 uppercase">{bgColor}</span>
              </div>
            </div>

            {/* Logo Center Overlay */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-500" />
                  Center Logo / Icon
                </span>
                {logoUrl && (
                  <button
                    onClick={() => setLogoUrl(null)}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" /> Remove Logo
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  Upload Brand Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setLogoUrl(URL.createObjectURL(file));
                        setEcLevel('H'); // Highest error correction for logos
                      }
                    }}
                  />
                </label>

                {logoUrl && (
                  <div className="flex items-center gap-2 flex-grow">
                    <span className="text-[11px] text-zinc-500">Logo Size:</span>
                    <input
                      type="range"
                      min="24"
                      max="72"
                      value={logoSize}
                      onChange={(e) => setLogoSize(Number(e.target.value))}
                      className="w-28 accent-indigo-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                  Error Correction Level
                </label>
                <select
                  value={ecLevel}
                  onChange={(e) => setEcLevel(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-medium"
                >
                  <option value="L">L - 7% Recovery</option>
                  <option value="M">M - 15% Standard</option>
                  <option value="Q">Q - 25% High</option>
                  <option value="H">H - 30% Max (For Logos)</option>
                </select>
              </div>

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMargin}
                    onChange={(e) => setIncludeMargin(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Include Safe Margin
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Preview & Downloads (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl shadow-zinc-200/50 dark:shadow-none space-y-6 text-center">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Live Dynamic Output
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                EC Level: {ecLevel}
              </span>
            </div>

            {/* QR Visual Container */}
            <div
              ref={canvasRef}
              className="p-6 rounded-2xl mx-auto flex items-center justify-center transition-all shadow-inner"
              style={{ backgroundColor: bgColor }}
            >
              <QRCodeCanvas
                value={qrString}
                size={qrSize}
                fgColor={fgColor}
                bgColor={bgColor}
                level={ecLevel}
                includeMargin={includeMargin}
                imageSettings={
                  logoUrl
                    ? {
                        src: logoUrl,
                        height: logoSize,
                        width: logoSize,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            {/* Hidden SVG for vector download */}
            <div className="hidden">
              <QRCodeSVG
                id="qr-svg-render"
                value={qrString}
                size={qrSize}
                fgColor={fgColor}
                bgColor={bgColor}
                level={ecLevel}
                includeMargin={includeMargin}
                imageSettings={
                  logoUrl
                    ? {
                        src: logoUrl,
                        height: logoSize,
                        width: logoSize,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>

            {/* Quick Actions & Downloads */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={downloadPNG}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>

                <button
                  onClick={downloadSVG}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white text-xs font-bold transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  Download SVG
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCopyImage}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Image!' : 'Copy to Clipboard'}
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print QR
                </button>
              </div>
            </div>

            {/* Payload preview snippet */}
            <div className="text-left bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Encoded Payload
              </span>
              <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-full">
                {qrString}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
