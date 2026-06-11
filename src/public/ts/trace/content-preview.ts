/**
 * R19.63-65 Content previewer — renders file content by MIME type.
 * image → <img>, text → <pre>, PDF → <iframe>, SVG → inline viewer.
 */

// [impl:uuid:4c897dae-affd-4528-bbda-2f4c373c6de8] R19.75 ContentPreviewer.authToken
export function renderContentPreview(uuid: string, mimeType: string, name: string, token?: string): string {
  const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;

  if (mimeType === 'image/svg+xml') {
    return `<div class="cv-preview"><object data="${contentUrl}" type="image/svg+xml" style="max-width:100%;background:white;border-radius:8px"></object></div>`;
  }
  if (mimeType.startsWith('image/')) {
    return `<div class="cv-preview"><img src="${contentUrl}" alt="${esc(name)}" style="max-width:100%;border-radius:8px"></div>`;
  }
  if (mimeType === 'application/pdf') {
// [impl:uuid:96fbfac9-10c2-4543-986b-a66b8eaebeda] R19.69 iframe sandbox
    return `<div class="cv-preview"><iframe src="${contentUrl}" sandbox="allow-same-origin" style="width:100%;height:400px;border:none;border-radius:8px"></iframe></div>`;
  }
  // [impl:uuid:cf44c51c-0e38-4f9c-bbf9-b4731eb6e8ce] R19.74 HTML sandboxed iframe
  if (mimeType === 'text/html') {
    return `<div class="cv-preview"><iframe src="${contentUrl}" sandbox="allow-same-origin" style="width:100%;height:400px;border:none;border-radius:8px;background:white"></iframe></div>`;
  }
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return `<div class="cv-preview cv-text-loading" data-uuid="${uuid}">Loading...</div>`;
  }
  return `<div class="cv-preview"><a href="${contentUrl}" download="${esc(name)}" class="cv-download">Download ${esc(name)}</a></div>`;
}

export async function loadTextPreview(container: HTMLElement, uuid: string, token?: string): Promise<void> {
  const el = container.querySelector(`.cv-text-loading[data-uuid="${uuid}"]`);
  if (!el) return;
  try {
    const resp = await fetch(`/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`);
    if (!resp.ok) { el.textContent = 'Failed to load'; return; }
    const text = await resp.text();
    const pre = document.createElement('pre');
    pre.style.cssText = 'max-height:300px;overflow:auto;background:rgba(0,0,0,0.3);padding:12px;border-radius:8px;font-size:0.8rem;white-space:pre-wrap';
    pre.textContent = text.slice(0, 10000);
    el.innerHTML = '';
    el.appendChild(pre);
    el.classList.remove('cv-text-loading');
  } catch { el.textContent = 'Failed to load'; }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
