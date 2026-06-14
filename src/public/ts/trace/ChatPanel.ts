/**
 * ChatPanel — Light DOM chat panel for the unified drawer.
 * Extracted from rb-chat-sheet (Shadow DOM) with identical API.
 * Renders into a container element, dispatches events that bubble.
 */
export class ChatPanel {
  private container: HTMLElement;
  private clientId = '';
  roomId = '';
  private lazyObserver: IntersectionObserver | null = null;
  private oldestIor: string | null = null;
  private lazyLoading = false;
  private noMore = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = `
      <div class="chat-invite-row" style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.08)">
        <button class="btn" id="cp-invite" style="padding:6px 12px;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;background:#667eea;color:white">Invite</button>
        <span style="font-size:0.75rem;opacity:0.5">Share room link</span>
        <span class="cp-ws-dot" id="cp-ws-dot" style="margin-left:auto;font-size:0.6rem;cursor:pointer;color:#4CAF50" title="Connected">●</span>
      </div>
      <div class="cp-messages" id="cp-messages" style="flex:1;overflow-y:auto;padding:0 0 8px;-webkit-overflow-scrolling:touch;min-height:60px"></div>
      <div style="display:flex;gap:6px;padding:8px 0;padding-bottom:calc(8px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.08)">
        <input type="text" id="cp-input" placeholder="Message..." maxlength="200" autocomplete="off" style="flex:1;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 10px;color:white;font-size:0.9rem;min-height:38px">
        <button class="btn" id="cp-send" style="padding:6px 12px;border:none;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;background:#667eea;color:white">Send</button>
      </div>`;

    const input = this.container.querySelector('#cp-input') as HTMLInputElement;
    const doSend = () => {
      const text = input.value.trim();
      if (!text) return;
      this.container.dispatchEvent(new CustomEvent('rb-chat-send', { detail: { text }, bubbles: true }));
      input.value = '';
    };
    this.container.querySelector('#cp-send')?.addEventListener('click', doSend);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });
    this.container.querySelector('#cp-invite')?.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('rb-invite', { bubbles: true }));
    });
    this.container.querySelector('#cp-ws-dot')?.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('rb-reconnect', { bubbles: true }));
    });
  }

  set clientIdentity(id: string) { this.clientId = id; }

  addMessage(senderId: string, senderName: string, text: string): void {
    const el = this.container.querySelector('#cp-messages');
    if (!el) return;
    el.appendChild(this.createBubble(senderId, senderName, text));
    el.scrollTop = el.scrollHeight;
  }

  loadHistory(messages: { senderId: string; senderName: string; text: string }[]): void {
    const el = this.container.querySelector('#cp-messages');
    if (!el) return;
    el.innerHTML = '';
    for (const m of messages) el.appendChild(this.createBubble(m.senderId, m.senderName, m.text));
    el.scrollTop = el.scrollHeight;
    this.setupLazyLoad();
  }

  setWsStatus(state: string, detail?: string): void {
    const dot = this.container.querySelector('#cp-ws-dot') as HTMLElement;
    if (!dot) return;
    dot.style.color = state === 'connected' ? '#4CAF50' : state === 'disconnected' ? '#f44336' : '#ff9800';
    dot.textContent = detail || '●';
    dot.title = state === 'connected' ? 'Connected' : state === 'disconnected' ? 'Disconnected — tap to reconnect' : `Reconnecting${detail ? ' in ' + detail : ''}`;
  }

  private setupLazyLoad(): void {
    const el = this.container.querySelector('#cp-messages');
    if (!el || this.lazyObserver) return;
    this.lazyObserver = new IntersectionObserver(async (entries) => {
      if (!entries[0]?.isIntersecting || this.lazyLoading || this.noMore || !this.roomId) return;
      this.lazyLoading = true;
      try {
        const before = this.oldestIor ? `&before=${encodeURIComponent(this.oldestIor)}` : '';
        const resp = await fetch(`/api/room/${this.roomId}/messages?limit=5${before}`);
        if (!resp.ok) { this.lazyLoading = false; return; }
        const data = await resp.json();
        const msgs = data.messages || [];
        if (msgs.length === 0 || !data.hasMore) this.noMore = true;
        if (msgs.length > 0) {
          this.oldestIor = `ior:instance:${msgs[0].uuid}`;
          const scrollH = el.scrollHeight;
          const scrollT = el.scrollTop;
          for (let i = msgs.length - 1; i >= 0; i--) {
            const m = msgs[i];
            el.prepend(this.createBubble(m.senderName === this.clientId ? this.clientId : 'other', m.senderName, m.text));
          }
          el.scrollTop = scrollT + (el.scrollHeight - scrollH);
        }
      } catch {}
      this.lazyLoading = false;
    }, { root: el as Element, threshold: 0.1 });
    const first = el.firstElementChild;
    if (first) this.lazyObserver.observe(first);
  }

  private createBubble(senderId: string, senderName: string, text: string): HTMLElement {
    const div = document.createElement('div');
    div.style.cssText = 'padding:4px 0;font-size:0.8rem;border-bottom:1px solid rgba(255,255,255,0.05);white-space:pre-wrap;word-break:break-word';
    if (senderId === this.clientId) div.style.opacity = '0.7';
    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = 'font-weight:600;color:#4dd0e1;margin-right:6px';
    nameSpan.textContent = senderName;
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    div.appendChild(nameSpan);
    div.appendChild(textSpan);
    return div;
  }
}
