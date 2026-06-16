/**
 * R19.63-65 Content previewer — renders file content by MIME type.
 * image → <img>, text → <pre>, PDF → <iframe>, SVG → inline viewer.
 */

// [impl:uuid:4c897dae-affd-4528-bbda-2f4c373c6de8] R19.75 ContentPreviewer.authToken
// [impl:uuid:7cd70c47-d2cd-4749-8bb6-18018c64bc14] R19.81 iframe pinch-zoom
export function renderContentPreview(uuid: string, mimeType: string, name: string, token?: string): string {
  const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;
  const actions = `<div class="cv-actions" data-uuid="${uuid}" data-token="${token || ''}" data-url="${esc(contentUrl)}" data-mime="${esc(mimeType)}" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn cv-preview-toggle" style="flex:1;font-size:0.8rem">👁 Preview</button><button class="btn cv-newtab" style="flex:1;font-size:0.8rem">↗ New tab</button></div>`;
  let preview = '';

  if (mimeType === 'image/svg+xml') {
    preview = `<div class="cv-preview-content" style="display:none"><object data="${contentUrl}" type="image/svg+xml" style="max-width:100%;background:white;border-radius:8px"></object></div>`;
  } else if (mimeType.startsWith('image/')) {
    preview = `<div class="cv-preview-content" style="display:none"><img src="${contentUrl}" alt="${esc(name)}" style="max-width:100%;border-radius:8px"></div>`;
  } else if (mimeType === 'application/pdf') {
    preview = `<div class="cv-preview-content" style="display:none"><div class="preview-zoom-container" style="overflow:hidden;touch-action:pan-y"><iframe src="${contentUrl}" sandbox="allow-same-origin" style="width:100%;height:400px;border:none;border-radius:8px;touch-action:pinch-zoom"></iframe></div></div>`;
  } else if (mimeType === 'text/html') {
    preview = `<div class="cv-preview-content" style="display:none"><div class="preview-zoom-container" style="overflow:hidden;touch-action:pan-y"><iframe src="${contentUrl}" sandbox="allow-same-origin" style="width:100%;height:400px;border:none;border-radius:8px;background:white;touch-action:pinch-zoom"></iframe></div></div>`;
  } else if (mimeType === 'text/uri-list' || name.endsWith('.url') || name.endsWith('.webloc')) {
    preview = `<div class="cv-preview-content cv-url-resolve" data-uuid="${uuid}" data-token="${token || ''}" style="display:none"><div class="cv-url-frame"></div></div>`;
  } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    preview = `<div class="cv-preview-content cv-text-loading" data-uuid="${uuid}" style="display:none">Loading...</div>`;
  } else {
    preview = `<div class="cv-preview-content" style="display:none"><a href="${contentUrl}" download="${esc(name)}" class="cv-download">Download ${esc(name)}</a></div>`;
  }

  return `<div class="cv-preview">${actions}${preview}</div>`;
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
  container.querySelectorAll('.cv-actions').forEach(el => {
    const contentUrl = (el as HTMLElement).dataset.url || '';
    const mime = (el as HTMLElement).dataset.mime || '';
    const uuid = (el as HTMLElement).dataset.uuid || '';
    const token = (el as HTMLElement).dataset.token || '';
    const previewContent = el.parentElement?.querySelector('.cv-preview-content') as HTMLElement | null;

    // Pre-resolve URL for .url/.webloc files (fix3: synchronous window.open)
    let resolvedUrl = contentUrl;
    const urlResolve = el.parentElement?.querySelector('.cv-url-resolve') as HTMLElement | null;
    if (urlResolve || mime === 'text/uri-list') {
      fetch(contentUrl).then(r => r.text()).then(text => {
        const url = text.trim().split('\n').filter(l => l.startsWith('http'))[0] || '';
        if (url) resolvedUrl = url;
      }).catch(() => {});
    }

    // Preview toggle
    el.querySelector('.cv-preview-toggle')?.addEventListener('click', () => {
      if (!previewContent) return;
      if (previewContent.style.display === 'none') {
        previewContent.style.display = '';
        if (urlResolve && resolvedUrl !== contentUrl) {
          const frame = urlResolve.querySelector('.cv-url-frame') as HTMLElement;
          if (frame) frame.innerHTML = `<iframe src="${resolvedUrl}" sandbox="allow-same-origin allow-scripts" style="width:100%;height:400px;border:none;border-radius:8px;background:white;touch-action:pinch-zoom"></iframe>`;
        }
        // Load text preview if needed
        const textEl = previewContent.classList.contains('cv-text-loading') ? previewContent : null;
        if (textEl) loadTextPreview(el.parentElement as HTMLElement, uuid, token);
        (el.querySelector('.cv-preview-toggle') as HTMLElement).textContent = '👁 Hide';
      } else {
        previewContent.style.display = 'none';
        (el.querySelector('.cv-preview-toggle') as HTMLElement).textContent = '👁 Preview';
      }
    });

    // New tab (synchronous — uses pre-resolved URL, no async gap)
    el.querySelector('.cv-newtab')?.addEventListener('click', () => {
      window.open(resolvedUrl, '_blank');
    });
  });
}

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.pdf': 'application/pdf',
  '.html': 'text/html', '.htm': 'text/html', '.url': 'text/uri-list', '.webloc': 'text/uri-list',
  '.json': 'application/json', '.txt': 'text/plain', '.md': 'text/plain',
  '.ts': 'text/plain', '.js': 'text/plain', '.css': 'text/plain',
};

export function guessMimeFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return MIME_MAP[name.slice(dot).toLowerCase()] || '';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
