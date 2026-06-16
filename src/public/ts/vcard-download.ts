// [impl:uuid:a1b2c3d4-e5f6-4a0b-bcde-f3f26cab0001] R20.31 shared vCard download
export interface VCardProfile {
  name: string;
  phone?: string;
  url?: string;
  avatar?: string;
  playerToken?: string;
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export async function downloadVCard(profile: VCardProfile): Promise<void> {
  // R20.31: try serving stored .vcf first
  let vcfText: string | null = null;
  const hasLocalData = profile.avatar?.startsWith('data:');
  if (profile.playerToken && !hasLocalData) {
    try {
      const r = await fetch(`/api/vcard/${profile.playerToken}`);
      if (r.ok) vcfText = await r.text();
    } catch { /* no stored vcard */ }
  }

  if (!vcfText) {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${profile.name}`];
    if (profile.phone) lines.push(`TEL:${profile.phone}`);
    if (profile.url) lines.push(`URL:${profile.url}`);
    const photoSrc = profile.avatar && profile.avatar.startsWith('data:')
      ? profile.avatar
      : (profile.playerToken ? `/api/avatar/${profile.playerToken}` : (profile.avatar || ''));
    if (photoSrc) {
      try {
        let dataUrl = photoSrc;
        if (!dataUrl.startsWith('data:')) {
          const res = await fetch(photoSrc);
          const buf = await res.arrayBuffer();
          const type = res.headers.get('content-type') || 'image/jpeg';
          dataUrl = `data:${type};base64,${bufToBase64(buf)}`;
        }
        const match = dataUrl.match(/^data:image\/([\w+.-]+);base64,(.+)$/);
        if (match) lines.push(`PHOTO;ENCODING=b;TYPE=${match[1].toUpperCase()}:${match[2]}`);
      } catch { /* silent */ }
    }
    lines.push(`NOTE:RawBin User${profile.playerToken ? ` — UUID: ${profile.playerToken}` : ''}`);
    lines.push('END:VCARD');
    vcfText = lines.join('\r\n');
  }

  // Enrich NOTE with download date + geolocation
  const downloadDate = new Date().toISOString();
  let geoLink = '';
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
    });
    geoLink = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
  } catch { /* denied — graceful fallback */ }

  const noteExtra = `\\nDownloaded: ${downloadDate}${geoLink ? `\\nLocation: ${geoLink}` : ''}`;
  if (vcfText.includes('NOTE:')) {
    vcfText = vcfText.replace(/(NOTE:[^\r\n]*)/, `$1${noteExtra}`);
  } else {
    vcfText = vcfText.replace('END:VCARD', `NOTE:RawBin vCard${noteExtra}\r\nEND:VCARD`);
  }

  const blob = new Blob([vcfText], { type: 'text/vcard' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${profile.name.replace(/[^a-zA-Z0-9 ]/g, '')}.vcf`;
  a.click();
  URL.revokeObjectURL(a.href);
}
