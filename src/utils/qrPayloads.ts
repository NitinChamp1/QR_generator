import { VCardData, WifiData, ExtractedField } from '@/types';

export function formatVCard(data: Partial<VCardData>): string {
  const parts: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];

  const n = `${data.lastName || ''};${data.firstName || ''};;;`.trim();
  if (data.firstName || data.lastName) {
    parts.push(`N:${n}`);
    parts.push(`FN:${[data.firstName, data.lastName].filter(Boolean).join(' ')}`);
  }
  if (data.organization) parts.push(`ORG:${data.organization}`);
  if (data.title) parts.push(`TITLE:${data.title}`);
  if (data.phone) parts.push(`TEL;TYPE=CELL,VOICE:${data.phone}`);
  if (data.email) parts.push(`EMAIL;TYPE=INTERNET,PREF:${data.email}`);
  if (data.website) {
    let url = data.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    parts.push(`URL:${url}`);
  }
  if (data.address) parts.push(`ADR;TYPE=WORK,POSTAL:;;${data.address};;;;`);
  if (data.notes) parts.push(`NOTE:${data.notes}`);

  parts.push('END:VCARD');
  return parts.join('\n');
}

export function formatWifi(data: WifiData): string {
  // Format: WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
  const hidden = data.hidden ? 'true' : 'false';
  const enc = data.encryption === 'nopass' ? 'nopass' : data.encryption;
  return `WIFI:T:${enc};S:${data.ssid};P:${data.password};H:${hidden};;`;
}

export function formatFieldsToPayload(fields: ExtractedField[], format: 'vcard' | 'json' | 'text' | 'url'): string {
  const enabledFields = fields.filter((f) => f.enabled && f.value.trim().length > 0);

  if (format === 'json') {
    const obj: Record<string, string> = {};
    for (const f of enabledFields) {
      obj[f.key] = f.value;
    }
    return JSON.stringify(obj, null, 2);
  }

  if (format === 'vcard') {
    const vCard: Partial<VCardData> = {};
    for (const f of enabledFields) {
      const k = f.key.toLowerCase();
      if (k.includes('name')) {
        const parts = f.value.trim().split(' ');
        vCard.firstName = parts[0] || '';
        vCard.lastName = parts.slice(1).join(' ') || '';
      } else if (k.includes('phone') || k.includes('mobile') || k.includes('tel')) {
        vCard.phone = f.value;
      } else if (k.includes('email') || k.includes('mail')) {
        vCard.email = f.value;
      } else if (k.includes('company') || k.includes('org') || k.includes('business')) {
        vCard.organization = f.value;
      } else if (k.includes('title') || k.includes('role') || k.includes('position')) {
        vCard.title = f.value;
      } else if (k.includes('web') || k.includes('url') || k.includes('site')) {
        vCard.website = f.value;
      } else if (k.includes('address') || k.includes('location')) {
        vCard.address = f.value;
      }
    }
    // If not enough for vcard, fallback to text
    if (!vCard.firstName && !vCard.phone && !vCard.email) {
      return enabledFields.map((f) => `${f.key}: ${f.value}`).join('\n');
    }
    return formatVCard(vCard);
  }

  if (format === 'url') {
    const linkField = enabledFields.find(
      (f) =>
        f.category === 'link' ||
        f.key.toLowerCase().includes('url') ||
        f.key.toLowerCase().includes('website') ||
        f.value.startsWith('http') ||
        f.value.startsWith('www.')
    );
    if (linkField) {
      let val = linkField.value.trim();
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        val = 'https://' + val;
      }
      return val;
    }
  }

  // Default: Formatted Text
  return enabledFields.map((f) => `${f.key}: ${f.value}`).join('\n');
}
