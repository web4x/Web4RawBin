// [impl:uuid:b7142a01-c302-4d03-ae04-f05f06a07c11] T142 vCard parser
export interface VCardData {
  fn?: string;
  tel?: string;
  url?: string;
  photo?: Blob;
}

export function parseVCard(text: string): VCardData {
  const result: VCardData = {};
  const lines = text.replace(/\r\n[ \t]/g, '').replace(/\r\n/g, '\n').split('\n');

  for (const line of lines) {
    if (line.startsWith('FN:')) {
      result.fn = line.slice(3).trim();
    } else if (line.startsWith('TEL') && line.includes(':')) {
      result.tel = line.slice(line.indexOf(':') + 1).trim();
    } else if (line.startsWith('URL') && line.includes(':')) {
      result.url = line.slice(line.indexOf(':') + 1).trim();
    } else if (line.startsWith('PHOTO')) {
      const dataStart = line.indexOf(':') + 1;
      const base64Data = line.slice(dataStart).trim();
      if (!base64Data) continue;
      const mimeMatch = line.match(/TYPE=(\w+)/i) || line.match(/MEDIATYPE=image\/(\w+)/i);
      const mime = mimeMatch ? `image/${mimeMatch[1].toLowerCase()}` : 'image/jpeg';
      try {
        const binary = atob(base64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        result.photo = new Blob([bytes], { type: mime });
      } catch { /* corrupt base64 — skip */ }
    }
  }
  return result;
}
