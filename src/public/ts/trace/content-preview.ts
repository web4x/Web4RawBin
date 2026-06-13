/**
 * R19.63-65 Content previewer — renders file content by MIME type.
 * image → <img>, text → <pre>, PDF → <iframe>, SVG → inline viewer.
 */

// [impl:uuid:4c897dae-affd-4528-bbda-2f4c373c6de8] R19.75 ContentPreviewer.authToken
// [impl:uuid:7cd70c47-d2cd-4749-8bb6-18018c64bc14] R19.81 iframe pinch-zoom
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
    return `<div class="cv-preview"><div class="preview-zoom-container" style="overflow:hidden;touch-action:pan-y"><iframe src="${contentUrl}" sandbox="allow-same-origin" style="width:100%;height:400px;border:none;border-radius:8px;touch-action:pinch-zoom"></iframe></div></div>`;
  }
  // [impl:uuid:cf44c51c-0e38-4f9c-bbf9-b4731eb6e8ce] R19.74 HTML sandboxed iframe
  if (mimeType === 'text/html') {
    return `<div class="cv-preview"><div class="preview-zoom-container" style="overflow:hidden;touch-action:pan-y"><iframe src="${contentUrl}" sandbox="allow-same-origin" style="width:100%;height:400px;border:none;border-radius:8px;background:white;touch-action:pinch-zoom"></iframe></div></div>`;
  }
// [impl:uuid:cde29329-9ede-4c31-9ab8-4a853b1e4280] R19.77 URL file action buttons
  if (mimeType === 'text/uri-list' || name.endsWith('.url') || name.endsWith('.webloc')) {
    return `<div class="cv-preview cv-url-actions" data-uuid="${uuid}" data-token="${token || ''}"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn cv-url-preview" style="flex:1">Open in preview</button><button class="btn cv-url-newtab" style="flex:1">Open in new tab</button></div><div class="cv-url-frame" style="display:none;margin-top:8px"></div></div>`;
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

export function wireUrlActions(container: HTMLElement): void {
  container.querySelectorAll('.cv-url-actions').forEach(el => {
    const uuid = (el as HTMLElement).dataset.uuid || '';
    const token = (el as HTMLElement).dataset.token || '';
    const urlSrc = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;
    el.querySelector('.cv-url-preview')?.addEventListener('click', async () => {
      const frame = el.querySelector('.cv-url-frame') as HTMLElement;
      if (!frame) return;
      try {
        const resp = await fetch(urlSrc);
        const text = (await resp.text()).trim().split('\n').filter(l => l.startsWith('http'))[0] || '';
        if (text) {
          frame.style.display = '';
          frame.innerHTML = `<iframe src="${text}" sandbox="allow-same-origin allow-scripts" style="width:100%;height:400px;border:none;border-radius:8px;background:white;touch-action:pinch-zoom"></iframe>`;
        }
      } catch {}
    });
    el.querySelector('.cv-url-newtab')?.addEventListener('click', async () => {
      try {
        const resp = await fetch(urlSrc);
        const text = (await resp.text()).trim().split('\n').filter(l => l.startsWith('http'))[0] || '';
        if (text) window.open(text, '_blank');
      } catch {}
    });
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
