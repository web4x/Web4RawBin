import { marked } from 'marked';

const MD_STYLES = `
:host { display: block; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; }
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
`;

export class RbPreview extends HTMLElement {
  private shadow: ShadowRoot;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentDir = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.shadow.innerHTML = `<style>${MD_STYLES}</style><div class="preview"></div>`;
  }

  setContent(markdown: string, filePath?: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.render(markdown, filePath), 300);
  }

  setContentImmediate(markdown: string, filePath?: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.render(markdown, filePath);
  }

  private render(markdown: string, filePath?: string): void {
    if (filePath) {
      const parts = filePath.split('/');
      parts.pop();
      this.currentDir = parts.join('/');
      if (this.currentDir) this.currentDir += '/';
    }

    let html = marked(markdown) as string;

    html = html.replace(/<a\s+href="([^"]+)"/g, (match, href: string) => {
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return `<a href="${href}" target="_blank" rel="noopener"`;
      }
      if (href.endsWith('.md')) {
        const resolved = this.currentDir + href;
        return `<a href="/edit/${encodeURIComponent(resolved)}"`;
      }
      return match;
    });

    const el = this.shadow.querySelector('.preview');
    if (el) el.innerHTML = html;
  }

  clear(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const el = this.shadow.querySelector('.preview');
    if (el) el.innerHTML = '';
  }
}

customElements.define('rb-preview', RbPreview);
