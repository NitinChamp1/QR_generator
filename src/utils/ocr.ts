import { createWorker } from 'tesseract.js';
import { ExtractedField, ExtractionResult } from '@/types';

export interface OCRProgress {
  status: string;
  progress: number;
}

export async function runClientOCR(
  imageSource: File | string,
  onProgress?: (progress: OCRProgress) => void
): Promise<ExtractionResult> {
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.({
          status: 'Recognizing text...',
          progress: Math.round(m.progress * 100),
        });
      } else if (m.status === 'loading tesseract core') {
        onProgress?.({
          status: 'Loading OCR Engine...',
          progress: Math.round((m.progress || 0) * 50),
        });
      } else {
        onProgress?.({
          status: m.status,
          progress: 10,
        });
      }
    },
  });

  const ret = await worker.recognize(imageSource);
  await worker.terminate();

  const rawText = ret.data.text || '';
  const fields = parseFieldsFromText(rawText);
  const detectedType = classifyDocumentType(rawText, fields);

  return {
    rawText,
    fields,
    detectedType,
  };
}

export function parseFieldsFromText(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let idCounter = 1;
  const addField = (
    key: string,
    value: string,
    category: ExtractedField['category'],
    confidence = 0.95
  ) => {
    // Avoid duplicate key-value pairs
    if (fields.some((f) => f.key.toLowerCase() === key.toLowerCase() && f.value === value)) {
      return;
    }
    fields.push({
      id: `field-${idCounter++}`,
      key,
      value: value.trim(),
      category,
      confidence,
      enabled: true,
    });
  };

  // 1. Explicit Key-Value detector (e.g. "Name: John Doe", "Phone : +12345", "Total = $50.00")
  for (const line of lines) {
    const kvMatch = line.match(/^([A-Za-z\s]{2,20})\s*[:=]\s*(.+)$/);
    if (kvMatch) {
      const k = kvMatch[1].trim();
      const v = kvMatch[2].trim();
      if (v.length > 0 && v.length < 100) {
        let cat: ExtractedField['category'] = 'general';
        const kl = k.toLowerCase();
        if (kl.includes('phone') || kl.includes('email') || kl.includes('name') || kl.includes('contact')) cat = 'contact';
        else if (kl.includes('total') || kl.includes('amount') || kl.includes('price') || kl.includes('tax')) cat = 'financial';
        else if (kl.includes('date') || kl.includes('time')) cat = 'date';
        else if (kl.includes('url') || kl.includes('web') || kl.includes('link')) cat = 'link';

        addField(k, v, cat, 0.98);
      }
    }
  }

  // 2. Emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex) || [];
  emails.forEach((email, i) => {
    addField(emails.length === 1 ? 'Email' : `Email ${i + 1}`, email, 'contact', 0.99);
  });

  // 3. Phone Numbers
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/g;
  const phones = text.match(phoneRegex) || [];
  phones
    .map((p) => p.trim())
    .filter((p) => p.replace(/\D/g, '').length >= 7 && p.replace(/\D/g, '').length <= 15)
    .forEach((phone, i) => {
      addField(phones.length === 1 ? 'Phone' : `Phone ${i + 1}`, phone, 'contact', 0.92);
    });

  // 4. URLs & Websites
  const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*|[a-zA-Z0-9-]+\.(?:com|org|net|io|co|in|dev|app|ai|me)\b[^\s]*/gi;
  const urls = text.match(urlRegex) || [];
  urls.forEach((url, i) => {
    // Avoid capturing emails as URLs
    if (!url.includes('@')) {
      addField(urls.length === 1 ? 'Website' : `Website ${i + 1}`, url, 'link', 0.95);
    }
  });

  // 5. Dates
  const dateRegex = /\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4})\b/gi;
  const dates = text.match(dateRegex) || [];
  dates.forEach((date, i) => {
    addField(dates.length === 1 ? 'Date' : `Date ${i + 1}`, date, 'date', 0.9);
  });

  // 6. Totals / Financial amounts
  const totalRegex = /(?:total|grand\s*total|subtotal|balance|amount\s*due|due|paid|net\s*amount)\s*[:=]?\s*([$€£₹Rs.]?\s*\d+(?:[.,]\d{1,2})?)/gi;
  let match;
  while ((match = totalRegex.exec(text)) !== null) {
    addField('Total Amount', match[1].trim(), 'financial', 0.94);
  }

  // 7. Invoice / Bill / Order Number
  const invoiceRegex = /(?:invoice|inv|bill|receipt|order|ref|token)\s*(?:no|number|#)?\s*[:#=.-]?\s*([A-Za-z0-9_-]{3,20})/gi;
  while ((match = invoiceRegex.exec(text)) !== null) {
    addField('Invoice #', match[1].trim(), 'financial', 0.9);
  }

  // 8. Name heuristic (if no explicit name found, check top lines)
  const hasName = fields.some((f) => f.key.toLowerCase().includes('name'));
  if (!hasName && lines.length > 0) {
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      const line = lines[i];
      // If line is short, clean alphabet characters, not an email, not a URL
      if (
        line.length > 2 &&
        line.length < 35 &&
        /^[A-Za-z\s.'-]+$/.test(line) &&
        !line.toLowerCase().includes('invoice') &&
        !line.toLowerCase().includes('receipt')
      ) {
        addField('Full Name', line, 'contact', 0.8);
        break;
      }
    }
  }

  // 9. If no fields detected at all, create an initial generic Text field
  if (fields.length === 0 && text.trim().length > 0) {
    addField('Summary Text', text.slice(0, 150).trim(), 'general', 0.7);
  }

  return fields;
}

function classifyDocumentType(text: string, fields: ExtractedField[]): ExtractionResult['detectedType'] {
  const lower = text.toLowerCase();
  const hasFinancial =
    fields.some((f) => f.category === 'financial') ||
    lower.includes('invoice') ||
    lower.includes('receipt') ||
    lower.includes('subtotal') ||
    lower.includes('tax') ||
    lower.includes('gst') ||
    lower.includes('total');

  if (hasFinancial) return 'receipt_invoice';

  const hasContact =
    fields.some((f) => f.category === 'contact') ||
    lower.includes('email') ||
    lower.includes('tel:') ||
    lower.includes('mobile');

  if (hasContact && fields.length >= 2) return 'business_card';

  return 'document';
}
