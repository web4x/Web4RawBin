/**
 * R19.63-65 Content previewer — renders file content by MIME type.
 * image → <img>, text → <pre>, PDF/HTML → <iframe>, SVG → <object>, url → resolved <iframe>.
 *
 * R21.9 (v0.6.74): old @400px iframe pinch-zoom path RETIRED. ALL preview surfaces
 * (room file details via RoomView + trace browser via rb-detail-view + rb-file-detail)
 * now share ONE pan/zoom path: a 75vh <rb-preview-pane> driven by RbPanZoom. DRY —
 * fillPreviewPane() is the single mime→content builder reused by every caller.
 */
import './rb-preview-pane.js';
import type { RbPreviewPane } from './rb-preview-pane.js';

// [impl:uuid:4c897dae-affd-4528-bbda-2f4c373c6de8] R19.75 ContentPreviewer.authToken
// [impl:uuid:7cd70c47-d2cd-4749-8bb6-18018c64bc14] R21.9 RbPanZoom preview (retired iframe pinch-zoom)
export function renderContentPreview(uuid: string, mimeType: string, name: string, token?: string): string {
  const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;
  const actions = `<div class="cv-actions" data-uuid="${uuid}" data-token="${token || ''}" data-url="${esc(contentUrl)}" data-mime="${esc(mimeType)}" data-name="${esc(name)}" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn cv-preview-toggle" style="flex:1;font-size:0.8rem">👁 Preview</button><button class="btn cv-newtab" style="flex:1;font-size:0.8rem">↗ New tab</button><button class="btn cv-reset" style="flex:1;font-size:0.8rem;display:none">⤢ Reset zoom</button></div>`;
  // In-flow 75vh pan/zoom pane (AC-a5: never position:fixed). Lazily filled on first toggle.
  const preview = `<rb-preview-pane class="cv-preview-content" style="display:none"></rb-preview-pane>`;
  return `<div class="cv-preview">${actions}${preview}</div>`;
}

/**
 * R21.9 — single mime→content builder (DRY): build the preview element for `mimeType`
 * and load it into the given pan/zoom pane. Reused by the room file view, the trace
 * browser detail view, and rb-file-detail. Text/url content fetched lazily.
 * v0.6.80: audio MIME → <audio controls>; text/uri-list YouTube URL → embedded player.
 */
// [impl:uuid:ca54081e-42cb-4a0e-a9a6-2af559091783] R22.5 ContentPreviewer.fillPreviewPane — audio + YouTube preview
export function fillPreviewPane(pane: RbPreviewPane, uuid: string, mimeType: string, name: string, token?: string): void {
  const contentUrl = `/api/room/file/${uuid}/content${token ? '?token=' + encodeURIComponent(token) : ''}`;
  const imgStyle = 'display:block;max-width:100%;height:auto';
  const frameStyle = 'width:100%;height:75vh;border:none;background:white';
  const preStyle = 'margin:0;padding:12px;white-space:pre-wrap;color:#e0e0e0;font-size:0.8rem';

  if (mimeType === 'image/svg+xml') {
    pane.setContent(`<object data="${contentUrl}" type="image/svg+xml" style="${imgStyle};background:white;border-radius:8px"></object>`);
  } else if (mimeType.startsWith('image/')) {
    pane.setContent(`<img src="${contentUrl}" alt="${esc(name)}" style="${imgStyle}">`);
  } else if (mimeType === 'application/pdf' || mimeType === 'text/html') {
    pane.setContent(`<iframe src="${contentUrl}" sandbox="allow-same-origin" style="${frameStyle}"></iframe>`);
  } else if (mimeType.startsWith('audio/')) {
    // v0.6.80: native HTML5 audio player (audio/mpeg, audio/wav, audio/ogg, audio/mp4) instead of download
    pane.setContent(`<audio controls src="${contentUrl}" style="width:100%;display:block;margin-top:40px"></audio>`);
  } else if (mimeType === 'text/uri-list' || name.endsWith('.url') || name.endsWith('.webloc')) {
    pane.setContent(`<pre style="${preStyle}">Resolving…</pre>`);
    fetch(contentUrl).then(r => r.text()).then(text => {
      const url = text.trim().split('\n').filter(l => l.startsWith('http'))[0] || '';
      const yt = youtubeId(url);
      if (yt) pane.setContent(`<iframe src="https://www.youtube.com/embed/${yt}" allowfullscreen allow="autoplay" style="${frameStyle}"></iframe>`); // v0.6.80: YouTube auto-embed
      else if (url) pane.setContent(`<iframe src="${esc(url)}" sandbox="allow-same-origin allow-scripts" style="${frameStyle}"></iframe>`);
      else pane.setContent(`<pre style="${preStyle}">No URL found</pre>`);
    }).catch(() => pane.setContent(`<pre style="${preStyle}">Failed to resolve</pre>`));
  } else if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    pane.setContent(`<pre style="${preStyle}">Loading…</pre>`);
    fetch(contentUrl).then(r => r.ok ? r.text() : Promise.reject()).then(txt => {
      pane.setContent(`<pre style="${preStyle}">${esc(txt.slice(0, 20000))}</pre>`);
    }).catch(() => pane.setContent(`<pre style="${preStyle}">Failed to load</pre>`));
  } else {
    pane.setContent(`<a href="${contentUrl}" download="${esc(name)}" style="display:block;padding:24px;color:#ff9800">⬇ Download ${esc(name)}</a>`);
  }
}

export function wireUrlActions(container: HTMLElement): void {
  container.querySelectorAll('.cv-actions').forEach(el => {
    const e = el as HTMLElement;
    const contentUrl = e.dataset.url || '';
    const mime = e.dataset.mime || '';
    const uuid = e.dataset.uuid || '';
    const token = e.dataset.token || '';
    const name = e.dataset.name || '';
    const pane = el.parentElement?.querySelector('rb-preview-pane.cv-preview-content') as RbPreviewPane | null;
    const toggleBtn = el.querySelector('.cv-preview-toggle') as HTMLElement | null;
    const resetBtn = el.querySelector('.cv-reset') as HTMLElement | null;
    let filled = false;

    // Pre-resolve external URL for .url/.webloc so New tab opens the site synchronously (no async gap).
    let resolvedUrl = contentUrl;
    if (mime === 'text/uri-list' || name.endsWith('.url') || name.endsWith('.webloc')) {
      fetch(contentUrl).then(r => r.text()).then(text => {
        const url = text.trim().split('\n').filter(l => l.startsWith('http'))[0] || '';
        if (url) resolvedUrl = url;
      }).catch(() => {});
    }

    toggleBtn?.addEventListener('click', () => {
      if (!pane) return;
      if (pane.style.display === 'none') {
        pane.style.display = '';
        if (resetBtn) resetBtn.style.display = '';
        if (!filled) { fillPreviewPane(pane, uuid, mime, name, token); filled = true; }
        toggleBtn.textContent = '👁 Hide';
      } else {
        pane.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        toggleBtn.textContent = '👁 Preview';
      }
    });

    resetBtn?.addEventListener('click', () => pane?.reset());

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
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.oga': 'audio/ogg',
};

/** v0.6.80: extract a YouTube video id from watch?v=ID / youtu.be/ID / embed/ID, else null. */
function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : null;
}

export function guessMimeFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0) return '';
  return MIME_MAP[name.slice(dot).toLowerCase()] || '';
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}
