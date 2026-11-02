export type TabType = 'extractor' | 'qr-studio' | 'converter';

export interface ExtractedField {
  id: string;
  key: string;
  value: string;
  confidence?: number;
  category: 'contact' | 'financial' | 'date' | 'general' | 'link';
  enabled: boolean;
}

export interface ExtractionResult {
  rawText: string;
  fields: ExtractedField[];
  detectedType: 'business_card' | 'receipt_invoice' | 'document' | 'general';
}

export type QRDataType = 'text' | 'url' | 'vcard' | 'wifi' | 'email' | 'sms' | 'json';

export interface VCardData {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  notes: string;
}

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface QRConfig {
  value: string;
  dataType: QRDataType;
  size: number;
  fgColor: string;
  bgColor: string;
  level: 'L' | 'M' | 'Q' | 'H';
  includeMargin: boolean;
  logoUrl?: string;
  logoSize?: number;
}

export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp' | 'image/x-icon';

export interface ConvertedFile {
  id: string;
  originalName: string;
  originalSize: number;
  originalType: string;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedName: string;
  convertedSize?: number;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

export type ConverterMode = 'image-to-image' | 'pdf-to-docx' | 'pdf-to-images' | 'images-to-pdf';
