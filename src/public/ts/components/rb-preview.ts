// [impl:uuid:7bb9a7dd-da94-4f9f-9e0c-1c37dab9de8d] T68 markdown preview
import { marked } from 'marked';

const PREVIEW_CSS = `
:host { display: block; height: 100%; overflow: auto; -webkit-overflow-scrolling: touch; }
.preview { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 16px 20px; color: #e0e0e0; line-height: 1.6; }
.preview a { color: #ffffff; }
.preview a:visited { color: #a8c8ff; }
.preview a:hover { color: #b8d8ff; text-decoration: underline; }
.preview h1, .preview h2, .preview h3 { margin-top: 1.5em; color: white; }
.preview code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; color: #e0e0e0; }
.preview pre { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; overflow-x: auto; }
.preview pre code { background: none; padding: 0; }
.preview table { border-collapse: collapse; width: 100%; }
.preview th, .preview td { border: 1px solid rgba(255,255,255,0.2); padding: 8px; text-align: left; }
.preview th { background: rgba(255,255,255,0.1); }
.preview blockquote { border-left: 3px solid #667eea; margin: 1em 0; padding: 0.5em 1em; opacity: 0.8; }
.preview img { max-width: 100%; border-radius: 8px; }
.preview ul, .preview ol { padding-left: 1.5em; }
.preview hr { border: none; border-top: 1px solid rgba(255,255,255,0.2); margin: 1.5em 0; }
.puml-container { display: flex; align-items: center; justify-content: center; min-height: 200px; padding: 16px; }
.puml-container svg { max-width: 100%; height: auto; }
.puml-error { color: #e74c3c; padding: 16px; font-family: monospace; font-size: 0.85rem; white-space: pre-wrap; }
.puml-loading { color: #999; text-align: center; padding: 40px; }
`;

export class RbPreview extends HTMLElement {
  private shadow: ShadowRoot;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentDir = '';
  private mode: 'md' | 'puml' | 'none' = 'none';
  private pumlScale = 1;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.innerHTML = `<style>${PREVIEW_CSS}</style><div class="preview"></div>`;
  }

  setContent(content: string, filePath?: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.mode = this.detectMode(filePath);
    if (this.mode === 'md') {
      this.debounceTimer = setTimeout(() => this.renderMarkdown(content, filePath), 300);
    }
  }

  setContentImmediate(content: string, filePath?: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.mode = this.detectMode(filePath);
    if (this.mode === 'md') this.renderMarkdown(content, filePath);
    else if (this.mode === 'puml') this.renderPuml(content);
  }

  async renderPuml(content: string): Promise<void> {
    const el = this.shadow.querySelector('.preview');
    if (!el) return;
    el.innerHTML = '<div class="puml-loading">Rendering PlantUML...</div>';
    this.pumlScale = 1;

    try {
      const res = await fetch('/api/puml-render', { method: 'POST', body: content });
      if (res.ok) {
        const svg = await res.text();
        el.innerHTML = `<div class="puml-container" id="puml-svg">${svg}</div>`;
        const container = this.shadow.getElementById('puml-svg');
        if (container) {
          container.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.pumlScale = Math.max(0.3, Math.min(5, this.pumlScale * (e.deltaY < 0 ? 1.1 : 0.9)));
            const svgEl = container.querySelector('svg') as SVGElement;
            if (svgEl) svgEl.style.transform = `scale(${this.pumlScale})`;
          });
        }
      } else {
        const err = await res.json().catch(() => ({ error: 'Render failed' }));
        el.innerHTML = `<div class="puml-error">${err.error}</div>`;
      }
    } catch {
      el.innerHTML = '<div class="puml-error">Failed to connect to PlantUML renderer</div>';
    }
  }

  private detectMode(filePath?: string): 'md' | 'puml' | 'none' {
    if (!filePath) return 'none';
    if (filePath.endsWith('.puml')) return 'puml';
    if (filePath.endsWith('.md')) return 'md';
    return 'none';
  }

  private renderMarkdown(markdown: string, filePath?: string): void {
    if (filePath) {
      const parts = filePath.split('/');
      parts.pop();
      this.currentDir = parts.join('/');
      if (this.currentDir) this.currentDir += '/';
    }
    let html = marked(markdown) as string;
    html = html.replace(/<a\s+href="([^"]+)"/g, (match, href: string) => {
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) return `<a href="${href}" target="_blank" rel="noopener"`;
      if (href.endsWith('.md')) return `<a href="/edit/${encodeURIComponent(this.currentDir + href)}"`;
      return match;
    });
    const el = this.shadow.querySelector('.preview');
    if (el) el.innerHTML = html;
  }

  clear(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.mode = 'none';
    const el = this.shadow.querySelector('.preview');
    if (el) el.innerHTML = '';
  }
}

customElements.define('rb-preview', RbPreview);
