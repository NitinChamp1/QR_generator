'use client';

import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import {
  Download,
  Copy,
  Check,
  Printer,
  Link as LinkIcon,
  FileText,
  Contact,
  Wifi,
  Mail,
  MessageSquare,
  Code,
  Image as ImageIcon,
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
    notes: 'Generated via Omni.Sys QR',
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
  const [jsonInput, setJsonInput] = useState<string>(
    '{\n  "status": "success",\n  "app": "Omni.Sys"\n}'
  );

  // Customization states
  const [fgColor, setFgColor] = useState<string>('#1c1917');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [qrSize, setQrSize] = useState<number>(260);
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('H');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState<number>(44);

  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

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

  const getQRString = (): string => {
    switch (dataType) {
      case 'url':
        return urlInput.startsWith('http://') || urlInput.startsWith('https://')
          ? urlInput
          : `https://${urlInput}`;
      case 'text':
        return textInput || 'Sample Text';
      case 'vcard':
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

  const downloadPNG = () => {
    const canvas = canvasRef.current?.querySelector('canvas');
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
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
    { label: 'Obsidian', hex: '#1c1917' },
    { label: 'Navy', hex: '#1e3a8a' },
    { label: 'Forest', hex: '#14532d' },
    { label: 'Burgundy', hex: '#7f1d1d' },
    { label: 'Slate', hex: '#334155' },
    { label: 'Bronze', hex: '#78350f' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="og-panel p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="og-badge bg-amber-100 text-stone-900 border-stone-800">
            MODULE #02
          </span>
          <h1 className="text-lg sm:text-xl font-bold font-mono tracking-tight uppercase text-stone-900">
            QR CODE STUDIO // MATRIX_BUILDER
          </h1>
        </div>
        <p className="text-xs font-mono text-stone-600 max-w-3xl">
          Construct vector &amp; bitmap QR codes according to ISO specifications. Embed custom logos,
          fine-tune foreground/background palettes, and export ready-for-print assets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Customizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Data Type Tab Selector */}
          <div className="og-panel overflow-hidden">
            <div className="og-titlebar">
              <span>[ENCODING_MODE]</span>
              <span className="text-[10px] text-stone-500">SELECT DATA TYPE</span>
            </div>

            <div className="p-3 bg-stone-50/70 border-b border-stone-200 flex flex-wrap gap-2">
              {[
                { id: 'url', label: 'URL Link', icon: LinkIcon },
                { id: 'vcard', label: 'vCard Contact', icon: Contact },
                { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
                { id: 'text', label: 'Plain Text', icon: FileText },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'sms', label: 'SMS', icon: MessageSquare },
                { id: 'json', label: 'JSON Data', icon: Code },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = dataType === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDataType(tab.id as QRDataType)}
                    className={`og-btn text-xs py-1 px-3 ${
                      isActive
                        ? 'bg-amber-100 text-stone-900 border-stone-800 font-bold'
                        : 'bg-white text-stone-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Inputs */}
            <div className="p-5 bg-white space-y-4">
              {dataType === 'url' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-stone-800">
                    TARGET_URL:
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="og-input w-full"
                  />
                </div>
              )}

              {dataType === 'text' && (
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold uppercase text-stone-800">
                    RAW_TEXT_CONTENT:
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={4}
                    placeholder="Type raw text, order reference, or message..."
                    className="og-input w-full"
                  />
                </div>
              )}

              {dataType === 'vcard' && (
                <div className="space-y-3 font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold block mb-1 text-stone-700">FIRST_NAME:</label>
                      <input
                        type="text"
                        value={vcardInput.firstName}
                        onChange={(e) =>
                          setVcardInput({ ...vcardInput, firstName: e.target.value })
                        }
                        className="og-input w-full py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 text-stone-700">LAST_NAME:</label>
                      <input
                        type="text"
                        value={vcardInput.lastName}
                        onChange={(e) =>
                          setVcardInput({ ...vcardInput, lastName: e.target.value })
                        }
                        className="og-input w-full py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold block mb-1 text-stone-700">TEL_NUMBER:</label>
                      <input
                        type="tel"
                        value={vcardInput.phone}
                        onChange={(e) => setVcardInput({ ...vcardInput, phone: e.target.value })}
                        className="og-input w-full py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 text-stone-700">EMAIL_ADDRESS:</label>
                      <input
                        type="email"
                        value={vcardInput.email}
                        onChange={(e) => setVcardInput({ ...vcardInput, email: e.target.value })}
                        className="og-input w-full py-1.5"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold block mb-1 text-stone-700">COMPANY_ORG:</label>
                      <input
                        type="text"
                        value={vcardInput.organization}
                        onChange={(e) =>
                          setVcardInput({ ...vcardInput, organization: e.target.value })
                        }
                        className="og-input w-full py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold block mb-1 text-stone-700">JOB_TITLE:</label>
                      <input
                        type="text"
                        value={vcardInput.title}
                        onChange={(e) => setVcardInput({ ...vcardInput, title: e.target.value })}
                        className="og-input w-full py-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-stone-700">WEBSITE_URL:</label>
                    <input
                      type="url"
                      value={vcardInput.website}
                      onChange={(e) => setVcardInput({ ...vcardInput, website: e.target.value })}
                      className="og-input w-full py-1.5"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold block mb-1 text-stone-700">POSTAL_ADDRESS:</label>
                    <input
                      type="text"
                      value={vcardInput.address}
                      onChange={(e) => setVcardInput({ ...vcardInput, address: e.target.value })}
                      className="og-input w-full py-1.5"
                    />
                  </div>
                </div>
              )}

              {dataType === 'wifi' && (
                <div className="space-y-3 font-mono">
                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-800">SSID_NETWORK_NAME:</label>
                    <input
                      type="text"
                      value={wifiInput.ssid}
                      onChange={(e) => setWifiInput({ ...wifiInput, ssid: e.target.value })}
                      className="og-input w-full"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-800">SECURITY_KEY_PASSWORD:</label>
                    <input
                      type="text"
                      value={wifiInput.password}
                      onChange={(e) => setWifiInput({ ...wifiInput, password: e.target.value })}
                      className="og-input w-full"
                      placeholder="Leave empty if open network"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-800">TYPE:</span>
                      <select
                        value={wifiInput.encryption}
                        onChange={(e) =>
                          setWifiInput({ ...wifiInput, encryption: e.target.value as any })
                        }
                        className="og-input py-1 text-xs font-bold"
                      >
                        <option value="WPA">WPA/WPA2/WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">OPEN (NO PASSWORD)</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-stone-800">
                      <input
                        type="checkbox"
                        checked={wifiInput.hidden}
                        onChange={(e) => setWifiInput({ ...wifiInput, hidden: e.target.checked })}
                        className="w-3.5 h-3.5 rounded-none border-stone-600"
                      />
                      HIDDEN_SSID
                    </label>
                  </div>
                </div>
              )}

              {dataType === 'email' && (
                <div className="space-y-2 font-mono">
                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-700">RECIPIENT_EMAIL:</label>
                    <input
                      type="email"
                      value={emailInput.to}
                      onChange={(e) => setEmailInput({ ...emailInput, to: e.target.value })}
                      className="og-input w-full py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-700">SUBJECT_LINE:</label>
                    <input
                      type="text"
                      value={emailInput.subject}
                      onChange={(e) => setEmailInput({ ...emailInput, subject: e.target.value })}
                      className="og-input w-full py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-700">BODY_TEXT:</label>
                    <textarea
                      rows={3}
                      value={emailInput.body}
                      onChange={(e) => setEmailInput({ ...emailInput, body: e.target.value })}
                      className="og-input w-full"
                    />
                  </div>
                </div>
              )}

              {dataType === 'sms' && (
                <div className="space-y-2 font-mono">
                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-700">PHONE_NUMBER:</label>
                    <input
                      type="tel"
                      value={smsInput.phone}
                      onChange={(e) => setSmsInput({ ...smsInput, phone: e.target.value })}
                      className="og-input w-full py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold block mb-1 text-stone-700">SMS_MESSAGE:</label>
                    <textarea
                      rows={3}
                      value={smsInput.message}
                      onChange={(e) => setSmsInput({ ...smsInput, message: e.target.value })}
                      className="og-input w-full"
                    />
                  </div>
                </div>
              )}

              {dataType === 'json' && (
                <div className="space-y-1 font-mono">
                  <label className="text-xs font-bold block mb-1 text-stone-700">JSON_RAW_PAYLOAD:</label>
                  <textarea
                    rows={5}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="og-input w-full font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Design Controls Window */}
          <div className="og-panel overflow-hidden">
            <div className="og-titlebar">
              <span>[VISUAL_ATTRIBUTES]</span>
              <span className="text-[10px] text-stone-500">PALETTE &amp; LOGO</span>
            </div>

            <div className="p-5 bg-white space-y-4 font-mono">
              {/* Pattern Color */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase text-stone-800">PATTERN_COLOR:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-6 h-6 border border-stone-600 rounded-none cursor-pointer"
                  />
                  <div className="flex gap-1.5">
                    {colorPresets.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => setFgColor(p.hex)}
                        className={`w-5 h-5 border border-stone-800 ${
                          fgColor === p.hex ? 'ring-2 ring-stone-900' : ''
                        }`}
                        style={{ backgroundColor: p.hex }}
                        title={p.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Color */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                <span className="text-xs font-bold uppercase text-stone-800">BACKGROUND_COLOR:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-6 h-6 border border-stone-600 rounded-none cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold uppercase text-stone-700">{bgColor}</span>
                </div>
              </div>

              {/* Center Logo Upload */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase flex items-center gap-1.5 text-stone-800">
                    <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
                    CENTER_BRAND_LOGO:
                  </span>
                  {logoUrl && (
                    <button
                      onClick={() => setLogoUrl(null)}
                      className="text-xs font-bold text-red-700 hover:underline flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> REMOVE
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="og-btn text-xs py-1 px-3 bg-white">
                    <ImageIcon className="w-3.5 h-3.5" />
                    CHOOSE_IMAGE_FILE
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLogoUrl(URL.createObjectURL(file));
                          setEcLevel('H');
                        }
                      }}
                    />
                  </label>

                  {logoUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-600">SIZE:</span>
                      <input
                        type="range"
                        min="24"
                        max="72"
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="accent-stone-800 w-24"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Error Correction & Margins */}
              <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1 text-stone-800">ERROR_CORRECTION:</label>
                  <select
                    value={ecLevel}
                    onChange={(e) => setEcLevel(e.target.value as any)}
                    className="og-input w-full py-1 text-xs font-bold"
                  >
                    <option value="L">L - 7% RECOVERY</option>
                    <option value="M">M - 15% STANDARD</option>
                    <option value="Q">Q - 25% HIGH</option>
                    <option value="H">H - 30% MAX (LOGOS)</option>
                  </select>
                </div>

                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-stone-800">
                    <input
                      type="checkbox"
                      checked={includeMargin}
                      onChange={(e) => setIncludeMargin(e.target.checked)}
                      className="w-3.5 h-3.5 rounded-none border-stone-600"
                    />
                    SAFE_MARGIN
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Output & Export (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="og-panel overflow-hidden sticky top-20">
            <div className="og-titlebar">
              <span>[RENDER_TARGET] :: OUTPUT_DISPLAY</span>
              <span className="text-[10px] text-stone-500">EC: {ecLevel}</span>
            </div>

            <div className="p-6 bg-white space-y-5 text-center">
              {/* QR Canvas Display Bezel */}
              <div
                ref={canvasRef}
                className="p-4 border-[1.5px] border-stone-800 mx-auto flex items-center justify-center shadow-[2px_2px_0px_#292524]"
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

              {/* Hidden SVG for Vector Export */}
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

              {/* Action Buttons */}
              <div className="space-y-2 font-mono">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={downloadPNG}
                    className="og-btn og-btn-primary text-xs py-2 uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    EXPORT PNG
                  </button>

                  <button
                    onClick={downloadSVG}
                    className="og-btn og-btn-yellow text-xs py-2 uppercase"
                  >
                    <Download className="w-3.5 h-3.5" />
                    EXPORT SVG
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopyImage} className="og-btn text-xs py-2 uppercase">
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-stone-700" />
                    )}
                    {copied ? 'COPIED!' : 'COPY IMAGE'}
                  </button>

                  <button onClick={handlePrint} className="og-btn text-xs py-2 uppercase">
                    <Printer className="w-3.5 h-3.5" />
                    PRINT QR
                  </button>
                </div>
              </div>

              {/* Raw Payload Readout */}
              <div className="text-left bg-stone-50 border border-stone-200 p-2.5">
                <span className="text-[10px] font-mono font-bold uppercase block mb-0.5 text-stone-500">
                  ENCODED_PAYLOAD_STRING:
                </span>
                <p className="text-xs font-mono truncate text-stone-800 font-bold">{qrString}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
