/**
// [impl:uuid:b05fcdf3-0d44-4d7d-bee2-b5edc55daa3a] DropDispatcher.urlDrop
 * DnD Drop Dispatcher — routes dropped files by mimeType.
 * State machine: IDLE→DRAGOVER→UPLOADING→COMPLETE.
 */

type DropHandler = (file: File, roomId: string, playerToken: string) => Promise<void>;
type StatusCallback = (state: string, detail?: string) => void;

export class DropDispatcher {
  private handlers = new Map<string, DropHandler>();
  private enterCount = 0;
  state: 'idle' | 'dragover' | 'uploading' | 'complete' = 'idle';
  private statusCb: StatusCallback | null = null;

  constructor(private baseUrl: string = '') {}

  onStatus(cb: StatusCallback): void { this.statusCb = cb; }

  register(mimePrefix: string, handler: DropHandler): void {
    this.handlers.set(mimePrefix, handler);
  }

  // [impl:uuid:8b400f1d-34e0-4fbf-abd5-06f0e0499b7a] DropDispatcher.enterDragZone
  onDropEnter(dz: HTMLElement): void {
    this.enterCount++;
    if (this.enterCount === 1) {
      this.state = 'dragover';
      dz.classList.add('rrc-drop-active');
      this.statusCb?.('dragover', 'Drop files here');
    }
  }

// [impl:uuid:c20ff555-4047-4290-9922-da70116aeefa] DropDispatcher.exitDragZone (split for DropDispatcher.feedba
  // [impl:uuid:dcfc5fe3-ff7a-44e3-927b-2aa03197498f] DropDispatcher.exitDragZone
  onDropExit(dz: HTMLElement): void {
    this.enterCount--;
    if (this.enterCount <= 0) {
      this.enterCount = 0;
      this.state = 'idle';
      dz.classList.remove('rrc-drop-active');
      this.statusCb?.('idle');
    }
  }

  resetDrag(dz: HTMLElement): void {
    this.enterCount = 0;
    this.state = 'idle';
    dz.classList.remove('rrc-drop-active');
  }

  // [impl:uuid:d6ec181b-3e6f-4b95-9b67-196cdb137ad3] DropDispatcher.uploadFile
  async uploadFile(file: File, roomId: string, playerToken: string): Promise<{ uuid: string; name: string; size: number } | null> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('playerToken', playerToken);
    const resp = await fetch(`${this.baseUrl}/api/room/${roomId}/upload`, { method: 'POST', body: fd });
    if (!resp.ok) return null;
    return resp.json();
  }

  // [impl:uuid:0bd88871-d496-448e-84b7-7daf8bee595a] DropDispatcher.uploadWithProgress
  uploadWithProgress(file: File, roomId: string, playerToken: string, onProgress: (pct: number) => void): Promise<{ uuid: string; name: string; size: number } | null> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${this.baseUrl}/api/room/${roomId}/upload`);
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); };
      xhr.onload = () => {
        try { resolve(xhr.status === 200 ? JSON.parse(xhr.responseText) : null); }
        catch { resolve(null); }
      };
      xhr.onerror = () => resolve(null);
      const fd = new FormData();
      fd.append('file', file);
      fd.append('playerToken', playerToken);
      xhr.send(fd);
    });
  }

  // [impl:uuid:971bdde0-004b-4896-bc8c-4570832f6304] DropDispatcher.routeUnknown
  async routeUnknown(file: File, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<void> {
    for (const [prefix, handler] of this.handlers) {
      if (file.type.startsWith(prefix)) {
        await handler(file, roomId, playerToken);
        return;
      }
    }
    sendChat(`[drop-debug] ${file.name} (${file.type || 'unknown'}) — no handler registered`);
  }

  // [impl:uuid:05ed9488-cef2-41f5-83b2-f8e046fcd77a] DropDispatcher.feedbackCycle
  async dispatch(file: File, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<{ uuid: string; name: string; size: number } | null> {
    this.state = 'uploading';
    this.statusCb?.('uploading', `Uploading ${file.name}...`);
    let result: { uuid: string; name: string; size: number } | null = null;
    if (file.type.startsWith('image/') || file.type.startsWith('text/') || file.type.startsWith('application/')) {
      result = await this.uploadWithProgress(file, roomId, playerToken, (pct) => {
        this.statusCb?.('uploading', `${file.name} ${pct}%`);
      });
    } else {
      await this.routeUnknown(file, roomId, playerToken, sendChat);
    }
    this.state = 'complete';
    this.statusCb?.(result ? 'complete' : 'error', result ? `Uploaded ${file.name}` : `Failed: ${file.name}`);
    setTimeout(() => { if (this.state === 'complete') { this.state = 'idle'; this.statusCb?.('idle'); } }, 2000);
    return result;
  }

  // [impl:uuid:b05fcdf3-0d44-4d7d-bee2-b5edc55daa3a] R19.62 DropDispatcher.urlDrop
  async dispatchUrl(url: string, roomId: string, playerToken: string, sendChat: (text: string) => void): Promise<{ uuid: string; name: string; size: number } | null> {
    this.state = 'uploading';
    this.statusCb?.('uploading', `Fetching ${url}...`);
    try {
      const name = url.split('/').pop() || 'link';
      const blob = new Blob([url], { type: 'text/uri-list' });
      const file = new File([blob], `${name}.url`, { type: 'text/uri-list' });
      const result = await this.uploadFile(file, roomId, playerToken);
      this.state = 'complete';
      this.statusCb?.(result ? 'complete' : 'error', result ? `Saved ${name}` : `Failed: ${url}`);
      setTimeout(() => { if (this.state === 'complete') { this.state = 'idle'; this.statusCb?.('idle'); } }, 2000);
      return result;
    } catch {
      this.state = 'idle';
      this.statusCb?.('error', `Failed: ${url}`);
      sendChat(`[url-drop] failed: ${url}`);
      return null;
    }
  }
}

export const dropDispatcher = new DropDispatcher();
