const SHEET_CSS = `
:host { display: block; position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; }
.sheet { background: rgba(20,20,40,0.95); color: white; border-radius: 16px 16px 0 0; transition: transform 0.3s ease; transform: translateY(calc(100% - 52px)); display: flex; flex-direction: column; max-height: 60vh; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }
.sheet.expanded { transform: translateY(0); }
.sheet.peek { transform: translateY(calc(100% - 90px)); }
.handle { display: flex; justify-content: center; padding: 8px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.handle-bar { width: 40px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; }
.preview { font-size: 0.8rem; opacity: 0.8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80vw; }
.invite-row { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-bottom: 1px solid rgba(255,255,255,0.08); }
.invite-label { font-size: 0.75rem; opacity: 0.5; }
.ws-dot { margin-left: auto; font-size: 0.6rem; cursor: pointer; }
.ws-connected { color: #4CAF50; }
.ws-disconnected { color: #f44336; }
.ws-reconnecting { color: #ff9800; }
.messages { flex: 1; overflow-y: auto; padding: 0 12px 8px; -webkit-overflow-scrolling: touch; min-height: 0; }
.msg { padding: 4px 0; font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05); white-space: pre-wrap; word-break: break-word; }
.msg-self { opacity: 0.7; }
.msg-name { font-weight: 600; color: #4dd0e1; margin-right: 6px; }
.input-bar { display: flex; gap: 6px; padding: 8px 12px; padding-bottom: calc(8px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,0.08); }
.input-bar input { flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; padding: 8px 10px; color: white; font-size: 0.9rem; min-height: 38px; }
.input-bar input:focus { outline: none; border-color: rgba(255,255,255,0.4); }
.input-bar input::placeholder { color: rgba(255,255,255,0.4); }
.btn { padding: 6px 12px; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; background: #667eea; color: white; }
`;

class RbChatSheet extends HTMLElement {
  private shadow: ShadowRoot;
  private expanded = false;
  private clientId = '';

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.clientId = this.getAttribute('client-id') || '';
    this.shadow.innerHTML = `<style>${SHEET_CSS}</style>
      <div class="sheet" id="sheet">
        <div class="handle" id="handle"><div class="handle-bar"></div></div>
        <div class="invite-row">
          <button class="btn" id="invite-btn">📨 Invite</button>
          <span class="invite-label">Share room link</span>
          <span class="ws-dot ws-connected" id="ws-dot" title="Connected">●</span>
        </div>
        <div class="messages" id="messages"></div>
        <div class="input-bar">
          <input type="text" id="input" placeholder="Message..." maxlength="200" autocomplete="off">
          <button class="btn" id="send-btn">Send</button>
        </div>
      </div>`;

    const sheet = this.shadow.getElementById('sheet')!;
    const handle = this.shadow.getElementById('handle')!;
    const input = this.shadow.getElementById('input') as HTMLInputElement;

    handle.addEventListener('click', () => {
      this.expanded = !this.expanded;
      sheet.classList.toggle('expanded', this.expanded);
    });

    let startY = 0;
    handle.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
    handle.addEventListener('touchmove', (e) => {
      const dy = startY - e.touches[0].clientY;
      if (dy > 30 && !this.expanded) { this.expanded = true; sheet.classList.add('expanded'); }
      if (dy < -30 && this.expanded) { this.expanded = false; sheet.classList.remove('expanded'); }
    }, { passive: true });

    const doSend = () => {
      const text = input.value.trim();
      if (!text) return;
      this.dispatchEvent(new CustomEvent('rb-chat-send', { detail: { text }, bubbles: true, composed: true }));
      input.value = '';
    };
    this.shadow.getElementById('send-btn')!.addEventListener('click', doSend);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });

    this.shadow.getElementById('invite-btn')!.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('rb-invite', { bubbles: true, composed: true }));
    });

    const wsDot = this.shadow.getElementById('ws-dot')!;
    wsDot.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('rb-reconnect', { bubbles: true, composed: true }));
    });
  }

  set clientIdentity(id: string) { this.clientId = id; }

  addMessage(senderId: string, senderName: string, text: string): void {
    const el = this.shadow.getElementById('messages');
    if (!el) return;
    el.appendChild(this.createBubble(senderId, senderName, text));
    el.scrollTop = el.scrollHeight;

    if (!this.expanded) {
      const handle = this.shadow.getElementById('handle')!;
      const sheet = this.shadow.getElementById('sheet')!;
      const preview = document.createElement('div');
      preview.className = 'preview';
      const b = document.createElement('b');
      b.textContent = `${senderName}:`;
      preview.appendChild(b);
      preview.appendChild(document.createTextNode(' ' + (text || '').replace(/\n/g, ' ').slice(0, 40)));
      handle.innerHTML = '';
      handle.appendChild(preview);
      sheet.classList.add('peek');
      setTimeout(() => {
        handle.innerHTML = '<div class="handle-bar"></div>';
        sheet.classList.remove('peek');
      }, 3000);
    }
  }

  loadHistory(messages: { senderId: string; senderName: string; text: string }[]): void {
    const el = this.shadow.getElementById('messages');
    if (!el) return;
    el.innerHTML = '';
    for (const m of messages) {
      el.appendChild(this.createBubble(m.senderId, m.senderName, m.text));
    }
    el.scrollTop = el.scrollHeight;
  }

  setWsStatus(state: string, detail?: string): void {
    const dot = this.shadow.getElementById('ws-dot');
    if (!dot) return;
    dot.className = `ws-dot ws-${state}`;
    dot.textContent = detail || '●';
    dot.title = state === 'connected' ? 'Connected' : state === 'disconnected' ? 'Disconnected — tap to reconnect' : `Reconnecting${detail ? ' in ' + detail : ''}`;
  }

  clear(): void {
    const el = this.shadow.getElementById('messages');
    if (el) el.innerHTML = '';
    this.expanded = false;
    const sheet = this.shadow.getElementById('sheet');
    if (sheet) sheet.classList.remove('expanded', 'peek');
  }

  private createBubble(senderId: string, senderName: string, text: string): HTMLElement {
    const div = document.createElement('div');
    div.className = `msg ${senderId === this.clientId ? 'msg-self' : ''}`;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'msg-name';
    nameSpan.textContent = senderName;
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    div.appendChild(nameSpan);
    div.appendChild(textSpan);
    return div;
  }
}

customElements.define('rb-chat-sheet', RbChatSheet);

export { RbChatSheet };
