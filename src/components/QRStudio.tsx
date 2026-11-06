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
  ArrowUpRight,
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

  const [fgColor, setFgColor] = useState<string>('#111111');
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
        return `mailto:${emailInput.to}?subject=${encodeURIComponent(emailInput.subject)}&body=${encodeURIComponent(emailInput.body)}`;
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
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Clipboard copy error:', err);
      }
    });
  };

  const colorPresets = [
    { label: 'Black', hex: '#111111' },
    { label: 'Orange', hex: '#ff5500' },
    { label: 'Navy', hex: '#1e3a8a' },
    { label: 'Green', hex: '#15803d' },
    { label: 'Red', hex: '#b91c1c' },
    { label: 'Slate', hex: '#475569' },
  ];

  const loadDemoPreset = (preset: 'vcard' | 'wifi' | 'json' | 'sms' | 'url') => {
    if (preset === 'vcard') {
      setDataType('vcard');
      setVcardInput({
        firstName: 'Nitin',
        lastName: 'Yadav',
        organization: 'Champ Technologies Inc.',
        title: 'Principal Systems Architect',
        phone: '+1 (415) 890-1122',
        email: 'nitin@champtechnologies.io',
        website: 'https://github.com/NitinChamp1',
        address: 'San Francisco, CA 94107',
        notes: 'Omni.Sys Verified Contact Card',
      });
    } else if (preset === 'wifi') {
      setDataType('wifi');
      setWifiInput({
        ssid: 'OmniSys_HighSpeed_5G',
        password: 'QuantumPasscode2026',
        encryption: 'WPA',
        hidden: false,
      });
    } else if (preset === 'json') {
      setDataType('json');
      setJsonInput(
        JSON.stringify(
          {
            event: 'ACCESS_GRANTED',
            terminal: 'GATE-04',
            token: 'TKN-8849-AUTH',
            timestamp: '2026-11-07T02:58:00Z',
            authorizedBy: 'OMNI.SYS',
          },
          null,
          2
        )
      );
    } else if (preset === 'sms') {
      setDataType('sms');
      setSmsInput({
        phone: '+1 555-0199',
        message: 'DISPATCH CONFIRMED: Order #89201 has cleared inspection.',
      });
    } else if (preset === 'url') {
      setDataType('url');
      setUrlInput('https://github.com/NitinChamp1/QR_generator');
    }
  };

  const dataTabs = [
    { id: 'url', label: 'URL Link', icon: LinkIcon },
    { id: 'vcard', label: 'vCard Contact', icon: Contact },
    { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
    { id: 'text', label: 'Plain Text', icon: FileText },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'sms', label: 'SMS', icon: MessageSquare },
    { id: 'json', label: 'JSON Data', icon: Code },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="tako-panel p-5 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-[11px] font-bold text-[#ff5500] uppercase tracking-wider block">
              [ PIPELINE // 02 · MATRIX_STUDIO ]
            </span>
            <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight uppercase text-black">
              QR<span className="text-[#ff5500]">STUDIO</span>
            </h1>
            <p className="text-[11px] font-mono text-stone-500 max-w-2xl">
              CUSTOMIZE · BRAND · EXPORT — HIGH-DPI VECTOR AND BITMAP QR GENERATION.
            </p>
          </div>

          {/* Quick Demo Presets */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono">
            <span className="text-[10px] font-bold text-stone-500 uppercase mr-1">DEMO PRESETS:</span>
            <button
              onClick={() => loadDemoPreset('vcard')}
              className="tako-btn text-[10px] py-1 px-2.5 bg-white"
            >
              <Contact className="w-3 h-3 text-[#ff5500]" />
              Executive vCard
            </button>
            <button
              onClick={() => loadDemoPreset('wifi')}
              className="tako-btn text-[10px] py-1 px-2.5 bg-white"
            >
              <Wifi className="w-3 h-3 text-[#ff5500]" />
              Office 5G Wi-Fi
            </button>
            <button
              onClick={() => loadDemoPreset('json')}
              className="tako-btn text-[10px] py-1 px-2.5 bg-white"
            >
              <Code className="w-3 h-3 text-[#ff5500]" />
              Webhook JSON
            </button>
            <button
              onClick={() => loadDemoPreset('sms')}
              className="tako-btn text-[10px] py-1 px-2.5 bg-white"
            >
              <MessageSquare className="w-3 h-3 text-[#ff5500]" />
              Dispatch SMS
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input & Customizer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Data Type Selector */}
          <div className="tako-panel overflow-hidden">
            <div className="tako-titlebar">
              <span className="font-bold">// ENCODING_MODE</span>
              <span className="text-[10px] text-stone-500 font-bold">SELECT SPEC</span>
            </div>

            <div className="p-3 bg-stone-50 border-b-2 border-black flex flex-wrap gap-2">
              {dataTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setDataType(tab.id as QRDataType)}
                    className={`tako-btn ${dataType === tab.id ? 'tako-btn-orange' : ''}`}
                    style={{ padding: '5px 10px', fontSize: '11px' }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form Area */}
            <div className="p-5 bg-white space-y-4">
              {dataType === 'url' && (
                <div className="space-y-1">
                  <label className="tako-label">TARGET_URL:</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com"
                    className="tako-input"
                  />
                </div>
              )}

              {dataType === 'text' && (
                <div className="space-y-1">
                  <label className="tako-label">RAW_TEXT_CONTENT:</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    rows={4}
                    placeholder="Type raw text, order reference, or message..."
                    className="tako-input"
                  />
                </div>
              )}

              {dataType === 'vcard' && (
                <div className="space-y-3 font-mono">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="tako-label-muted block mb-1">FIRST_NAME:</label>
                      <input type="text" value={vcardInput.firstName} onChange={(e) => setVcardInput({ ...vcardInput, firstName: e.target.value })} className="tako-input" />
                    </div>
                    <div>
                      <label className="tako-label-muted block mb-1">LAST_NAME:</label>
                      <input type="text" value={vcardInput.lastName} onChange={(e) => setVcardInput({ ...vcardInput, lastName: e.target.value })} className="tako-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="tako-label-muted block mb-1">TEL_NUMBER:</label>
                      <input type="tel" value={vcardInput.phone} onChange={(e) => setVcardInput({ ...vcardInput, phone: e.target.value })} className="tako-input" />
                    </div>
                    <div>
                      <label className="tako-label-muted block mb-1">EMAIL_ADDRESS:</label>
                      <input type="email" value={vcardInput.email} onChange={(e) => setVcardInput({ ...vcardInput, email: e.target.value })} className="tako-input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="tako-label-muted block mb-1">COMPANY_ORG:</label>
                      <input type="text" value={vcardInput.organization} onChange={(e) => setVcardInput({ ...vcardInput, organization: e.target.value })} className="tako-input" />
                    </div>
                    <div>
                      <label className="tako-label-muted block mb-1">JOB_TITLE:</label>
                      <input type="text" value={vcardInput.title} onChange={(e) => setVcardInput({ ...vcardInput, title: e.target.value })} className="tako-input" />
                    </div>
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">WEBSITE_URL:</label>
                    <input type="url" value={vcardInput.website} onChange={(e) => setVcardInput({ ...vcardInput, website: e.target.value })} className="tako-input" />
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">POSTAL_ADDRESS:</label>
                    <input type="text" value={vcardInput.address} onChange={(e) => setVcardInput({ ...vcardInput, address: e.target.value })} className="tako-input" />
                  </div>
                </div>
              )}

              {dataType === 'wifi' && (
                <div className="space-y-3 font-mono">
                  <div>
                    <label className="tako-label block mb-1">SSID_NETWORK_NAME:</label>
                    <input type="text" value={wifiInput.ssid} onChange={(e) => setWifiInput({ ...wifiInput, ssid: e.target.value })} className="tako-input" />
                  </div>
                  <div>
                    <label className="tako-label block mb-1">SECURITY_KEY_PASSWORD:</label>
                    <input type="text" value={wifiInput.password} onChange={(e) => setWifiInput({ ...wifiInput, password: e.target.value })} className="tako-input" placeholder="Leave empty if open network" />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="tako-label">TYPE:</span>
                      <select value={wifiInput.encryption} onChange={(e) => setWifiInput({ ...wifiInput, encryption: e.target.value as any })} className="tako-input" style={{ width: 'auto' }}>
                        <option value="WPA">WPA/WPA2/WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">OPEN (NO PASSWORD)</option>
                      </select>
                    </div>
                    <label className="flex items-center gap-2 tako-label cursor-pointer">
                      <input type="checkbox" checked={wifiInput.hidden} onChange={(e) => setWifiInput({ ...wifiInput, hidden: e.target.checked })} className="w-3.5 h-3.5" />
                      HIDDEN_SSID
                    </label>
                  </div>
                </div>
              )}

              {dataType === 'email' && (
                <div className="space-y-2 font-mono">
                  <div>
                    <label className="tako-label-muted block mb-1">RECIPIENT_EMAIL:</label>
                    <input type="email" value={emailInput.to} onChange={(e) => setEmailInput({ ...emailInput, to: e.target.value })} className="tako-input" />
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">SUBJECT_LINE:</label>
                    <input type="text" value={emailInput.subject} onChange={(e) => setEmailInput({ ...emailInput, subject: e.target.value })} className="tako-input" />
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">BODY_TEXT:</label>
                    <textarea rows={3} value={emailInput.body} onChange={(e) => setEmailInput({ ...emailInput, body: e.target.value })} className="tako-input" />
                  </div>
                </div>
              )}

              {dataType === 'sms' && (
                <div className="space-y-2 font-mono">
                  <div>
                    <label className="tako-label-muted block mb-1">PHONE_NUMBER:</label>
                    <input type="tel" value={smsInput.phone} onChange={(e) => setSmsInput({ ...smsInput, phone: e.target.value })} className="tako-input" />
                  </div>
                  <div>
                    <label className="tako-label-muted block mb-1">SMS_MESSAGE:</label>
                    <textarea rows={3} value={smsInput.message} onChange={(e) => setSmsInput({ ...smsInput, message: e.target.value })} className="tako-input" />
                  </div>
                </div>
              )}

              {dataType === 'json' && (
                <div className="space-y-1 font-mono">
                  <label className="tako-label-muted block mb-1">JSON_RAW_PAYLOAD:</label>
                  <textarea rows={5} value={jsonInput} onChange={(e) => setJsonInput(e.target.value)} className="tako-input" />
                </div>
              )}
            </div>
          </div>

          {/* Visual Attributes */}
          <div className="tako-panel overflow-hidden">
            <div className="tako-titlebar">
              <span className="font-bold">// VISUAL_ATTRIBUTES</span>
              <span className="text-[10px] text-stone-500 font-bold">PALETTE &amp; LOGO</span>
            </div>

            <div className="p-5 bg-white space-y-4 font-mono">
              {/* Pattern Color */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="tako-label">PATTERN_COLOR:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-7 h-7 border-2 border-black cursor-pointer"
                    style={{ borderRadius: 0, padding: 0 }}
                  />
                  <div className="flex gap-1.5">
                    {colorPresets.map((p) => (
                      <button
                        key={p.hex}
                        onClick={() => setFgColor(p.hex)}
                        className={`w-5 h-5 border border-black ${fgColor === p.hex ? 'ring-2 ring-[#ff5500] ring-offset-1' : ''}`}
                        style={{ backgroundColor: p.hex }}
                        title={p.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Background Color */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
                <span className="tako-label">BACKGROUND_COLOR:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 border-2 border-black cursor-pointer"
                    style={{ borderRadius: 0, padding: 0 }}
                  />
                  <span className="text-xs font-mono font-bold text-black">{bgColor}</span>
                </div>
              </div>

              {/* Logo Upload */}
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="tako-label flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#ff5500]" />
                    CENTER_BRAND_LOGO:
                  </span>
                  {logoUrl && (
                    <button onClick={() => setLogoUrl(null)} className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 font-mono">
                      <RotateCcw className="w-3 h-3" /> REMOVE
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="tako-btn" style={{ padding: '5px 10px', fontSize: '11px', cursor: 'pointer' }}>
                    <ImageIcon className="w-3.5 h-3.5 text-[#ff5500]" />
                    CHOOSE_IMAGE_FILE
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { setLogoUrl(URL.createObjectURL(file)); setEcLevel('H'); }
                      }}
                    />
                  </label>
                  {logoUrl && (
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-black">SIZE:</span>
                      <input type="range" min="24" max="72" value={logoSize} onChange={(e) => setLogoSize(Number(e.target.value))} className="accent-[#ff5500] w-24" />
                    </div>
                  )}
                </div>
              </div>

              {/* Error Correction & Margins */}
              <div className="pt-2 border-t border-stone-200 grid grid-cols-2 gap-4">
                <div>
                  <label className="tako-label block mb-1">ERROR_CORRECTION:</label>
                  <select value={ecLevel} onChange={(e) => setEcLevel(e.target.value as any)} className="tako-input" style={{ fontSize: '11px' }}>
                    <option value="L">L - 7% RECOVERY</option>
                    <option value="M">M - 15% STANDARD</option>
                    <option value="Q">Q - 25% HIGH</option>
                    <option value="H">H - 30% MAX (LOGOS)</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 tako-label cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMargin}
                      onChange={(e) => setIncludeMargin(e.target.checked)}
                      className="w-3.5 h-3.5"
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
          <div className="tako-panel overflow-hidden sticky top-20">
            <div className="tako-titlebar">
              <span className="font-bold">// RENDER_TARGET</span>
              <div className="w-5 h-5 border border-black flex items-center justify-center bg-white">
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </div>

            <div className="p-6 bg-white space-y-5 text-center">
              {/* QR Canvas Bezel */}
              <div
                ref={canvasRef}
                className="p-4 border-2 border-black mx-auto inline-flex items-center justify-center shadow-[3px_3px_0px_#111]"
                style={{ backgroundColor: bgColor }}
              >
                <QRCodeCanvas
                  value={qrString}
                  size={qrSize}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={ecLevel}
                  includeMargin={includeMargin}
                  imageSettings={logoUrl ? { src: logoUrl, height: logoSize, width: logoSize, excavate: true } : undefined}
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
                  imageSettings={logoUrl ? { src: logoUrl, height: logoSize, width: logoSize, excavate: true } : undefined}
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={downloadPNG} className="tako-btn tako-btn-black" style={{ padding: '10px', fontSize: '11px' }}>
                    <Download className="w-3.5 h-3.5" />
                    EXPORT PNG
                  </button>
                  <button onClick={downloadSVG} className="tako-btn tako-btn-orange" style={{ padding: '10px', fontSize: '11px' }}>
                    <Download className="w-3.5 h-3.5" />
                    EXPORT SVG
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopyImage} className="tako-btn" style={{ padding: '8px', fontSize: '11px' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-[#ff5500]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'COPIED!' : 'COPY IMAGE'}
                  </button>
                  <button onClick={() => window.print()} className="tako-btn" style={{ padding: '8px', fontSize: '11px' }}>
                    <Printer className="w-3.5 h-3.5" />
                    PRINT QR
                  </button>
                </div>
              </div>

              {/* Payload Readout */}
              <div className="text-left bg-stone-50 border-2 border-black p-3">
                <span className="text-[10px] font-mono font-bold uppercase block mb-1 text-stone-500">
                  ENCODED_PAYLOAD_STRING:
                </span>
                <p className="text-xs font-mono truncate text-black font-bold">{qrString}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
