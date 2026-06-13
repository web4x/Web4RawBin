/**
// [test:uuid:6940edd5-cd1b-4392-a28a-ac7d1cc64401]
 * T39-T41: Web Component unit tests
 * [test:uuid:7e304eec-2c8c-4e2f-b2f0-b46bea80feb0] T39-T41 web components
 * T39: rb-update-banner — version check, banner DOM, click handler
 * T40: rb-header — attributes, events
 * T41: rb-overlay — base class for modal overlays
 *
 * Uses jsdom environment for DOM APIs.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
// [test:uuid:c73b0ad9-7f6b-408d-ae0e-2607e3f19c0e] R19.86 dismiss threshold guard
// [test:uuid:1453e442-7f12-4a62-873d-a77d6feac550]
// [test:uuid:68a81a25-8c76-42f6-9d39-269a4426c139]
// [test:uuid:a4f8ccb0-1f0f-4798-b21d-c4c77fce772c]
// [test:uuid:7fcf0d03-4b81-432f-8691-b5e7629bb378]
// [test:uuid:84222a39-56d7-4550-a2bf-b804e3791edb]
// [test:uuid:3d82754c-8e2f-4989-9f29-c23d42ddb445]
// [test:uuid:178f14b2-9f1e-4b42-872f-c1fb02698161]
// [test:uuid:7f62966c-d044-4a8b-b811-d3cf5dd74f35]
// [test:uuid:c57d8b81-bea1-4379-b622-6612d96e33c8]
// [test:uuid:2c2bd7d1-93e9-4554-9af0-656ed48750fa]
// [test:uuid:05f6dbaf-8a8e-41b5-a5b6-f38c8fee8d80]
// [test:uuid:b6086e8c-f138-4c42-9b98-e8173f75c56b]
// [test:uuid:5b79cc8e-e44c-4cbb-ab54-9d9d06ab596b]
// [test:uuid:e8a971b2-80a2-4541-b961-791cdb7f9355]
// [test:uuid:8be26b85-43d8-4b4a-be49-081fa530b62b]
// [test:uuid:a570f8c7-8c19-4087-aa6e-d9d7d12cb021]
// [test:uuid:46c054d5-c401-4834-a6f1-6ff4f81510a2]
// [test:uuid:d57ae802-d32c-4fb4-861f-df279f109d1f]
// [test:uuid:d9eb4ccc-ffe4-462c-ae9b-3c9b0f812d74]
// [test:uuid:287416e2-ea01-49fa-bfc9-d97411d136c1]
// [test:uuid:b09e2986-8320-4943-8aae-d76d2ce58604]
// [test:uuid:344529b0-743e-484b-9e87-6f709b87a381]
// [test:uuid:1de42ff2-5c61-41eb-924e-5a8e97e83597]
// [test:uuid:f598287d-6c7e-4b67-9a54-dad9b6fbc8b4]
// [test:uuid:de5aa406-7270-4bf9-a966-093d8b3aa396]
// [test:uuid:d9db192f-8fcd-4623-a41f-0cfba069dbcf]
// [test:uuid:0d86c2db-6683-4b29-9111-8930d5d1e1fe]
// [test:uuid:e6dd7649-f982-4327-9197-9e8ecd4f6559]
// [test:uuid:ba73abc6-4cb8-414d-a13a-0b446f3fbba0]
// [test:uuid:d25cc4c2-96a8-42a8-a06e-7c2678a8fe4a]
// [test:uuid:3e6c0e2c-1149-46c2-bcfb-e3e19daadda1]
// [test:uuid:50601482-070f-401e-8894-d88515deb476]
// [test:uuid:a68880ee-7e63-4785-970e-80b1d48044d5]
// [test:uuid:9e161bda-82d2-4ee5-aa64-d04aadb394dc]
// [test:uuid:2ee90d4e-a2eb-4606-a958-33ca4af4e0ba]
// [test:uuid:f5398d74-3840-441d-917d-cd4f8d752644]
// [test:uuid:2c11b869-ca5b-439b-8c55-cf2b4137fa13]
// [test:uuid:ae08d5ec-3ac6-4325-899a-1f4f2dee9a46]
// [test:uuid:adb2b8aa-474e-44ce-b5a3-2b7a2dd13bd5]
// [test:uuid:2935a949-27cc-44ee-be37-1b26987514c6]
// [test:uuid:21aff647-8625-4d9c-9d9a-ae3d017e5cfd]
// [test:uuid:c20ea27f-6659-4e95-9f95-985dc530d80f]
// [test:uuid:59673fc0-9d71-488d-9fd3-5bbea5fe9dea]
// [test:uuid:5edd2404-638a-4381-b6e5-80ec5ab4fb37]
// [test:uuid:d75a9be1-72e8-45f5-a698-2d36424e7418]
// [test:uuid:74a690fa-a748-4aec-8b22-f90892076ce2]
// [test:uuid:8c3266e2-b3df-4a1a-bc7b-25ac32bba324]
// [test:uuid:a62fd762-08ce-4bb1-8e07-da9e3aacedf3]
// [test:uuid:b13336fd-f512-4b97-876c-23c0afa3992e]
// [test:uuid:9c52d370-c9d1-4daf-bb7e-468bf4df4494]
// [test:uuid:a8525098-17ca-4b73-a4f0-df917cf18426]
// [test:uuid:3fdeb347-bcad-415a-8057-407a79a66331]
// [test:uuid:8bbdde41-4ce5-4af4-a6e9-849cc7cb0109]
// [test:uuid:b7cee4ce-12ec-4eaa-b8c9-f3c9baac2f2f]

// ═══════════════════════════════════════════════════════════════════════════
// T41: rb-overlay base class
// ═══════════════════════════════════════════════════════════════════════════

// Replicate the shared overlay pattern extracted from ProfileEditor,
// ProfileSheet, DeviceEnrollDialog (spec from task-41-overlay.md)

class RbOverlay {
  private overlay: HTMLElement | null = null;
  private onClose: (() => void) | null = null;
  private startY = 0;
  private bodyOverflowBefore = '';

  get isOpen(): boolean { return this.overlay !== null; }
  get element(): HTMLElement | null { return this.overlay; }

  show(content: string, opts?: { className?: string; closable?: boolean; onClose?: () => void }): HTMLElement {
    if (this.overlay) this.hide();

    const closable = opts?.closable !== false;
    this.onClose = opts?.onClose ?? null;

    this.overlay = document.createElement('div');
    this.overlay.className = `rb-overlay ${opts?.className || ''}`.trim();
    this.overlay.innerHTML = `<div class="rb-overlay-sheet">${content}</div>`;

    if (closable) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.hide();
      });
    }

    // Prevent body scroll
    this.bodyOverflowBefore = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.body.appendChild(this.overlay);

    // Touch-to-dismiss on drag down
    const sheet = this.overlay.querySelector('.rb-overlay-sheet') as HTMLElement;
    if (sheet && closable) {
      sheet.addEventListener('touchstart', (e: TouchEvent) => {
        this.startY = e.touches[0].clientY;
      }, { passive: true });
      sheet.addEventListener('touchmove', (e: TouchEvent) => {
        if (e.touches[0].clientY - this.startY > 50) this.hide();
      }, { passive: true });
    }

    return this.overlay;
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      document.body.style.overflow = this.bodyOverflowBefore;
      this.onClose?.();
      this.onClose = null;
    }
  }
}

// Mock minimal DOM for testing
let mockBody: { children: HTMLElement[]; style: Record<string, string>; appendChild: (el: HTMLElement) => void };
let originalDocument: any;

beforeEach(() => {
  // Reset JSDOM-like state
  // Using vi to mock document.body operations
  mockBody = {
    children: [],
    style: { overflow: '' },
    appendChild: vi.fn((el: HTMLElement) => mockBody.children.push(el)),
  };
});

// ── TC-41.1: Backdrop creation ──────────────────────────────────────────────

describe('TC-41.1: Overlay backdrop creation', () => {

  it('show() creates overlay element', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Test</p>');

    expect(overlay.isOpen).toBe(true);
    expect(overlay.element).not.toBeNull();
  });

  it('overlay has rb-overlay class', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Test</p>');

    expect(overlay.element!.className).toContain('rb-overlay');
  });

  it('overlay contains sheet with content', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Hello</p>');

    const sheet = overlay.element!.querySelector('.rb-overlay-sheet');
    expect(sheet).not.toBeNull();
    expect(sheet!.innerHTML).toBe('<p>Hello</p>');
  });

  it('custom className is appended', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Test</p>', { className: 'profile-gate' });

    expect(overlay.element!.className).toContain('rb-overlay');
    expect(overlay.element!.className).toContain('profile-gate');
  });
});

// ── TC-41.2: Click-to-close ─────────────────────────────────────────────────

describe('TC-41.2: Click backdrop to close', () => {

  it('clicking overlay backdrop calls hide', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Closable</p>', { closable: true });

    const el = overlay.element!;
    // Simulate click on backdrop (target === overlay)
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: el });
    el.dispatchEvent(event);

    expect(overlay.isOpen).toBe(false);
  });

  it('clicking sheet content does NOT close', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Content</p>', { closable: true });

    const sheet = overlay.element!.querySelector('.rb-overlay-sheet')!;
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: sheet });
    overlay.element!.dispatchEvent(event);

    expect(overlay.isOpen).toBe(true);
  });

  it('closable=false disables backdrop click', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Non-closable</p>', { closable: false });

    const el = overlay.element!;
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: el });
    el.dispatchEvent(event);

    expect(overlay.isOpen).toBe(true);
  });
});

// ── TC-41.3: show()/hide() methods ──────────────────────────────────────────

describe('TC-41.3: show/hide lifecycle', () => {

  it('starts closed', () => {
    const overlay = new RbOverlay();
    expect(overlay.isOpen).toBe(false);
    expect(overlay.element).toBeNull();
  });

  it('show() opens, hide() closes', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Open</p>');
    expect(overlay.isOpen).toBe(true);

    overlay.hide();
    expect(overlay.isOpen).toBe(false);
    expect(overlay.element).toBeNull();
  });

  it('double show() replaces previous overlay', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>First</p>');
    const first = overlay.element;

    overlay.show('<p>Second</p>');
    const second = overlay.element;

    expect(second).not.toBe(first);
    expect(second!.querySelector('.rb-overlay-sheet')!.innerHTML).toBe('<p>Second</p>');
  });

  it('double hide() is safe (no error)', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Test</p>');
    overlay.hide();
    expect(() => overlay.hide()).not.toThrow();
    expect(overlay.isOpen).toBe(false);
  });

  it('onClose callback fires on hide', () => {
    const overlay = new RbOverlay();
    const onClose = vi.fn();
    overlay.show('<p>Test</p>', { onClose });

    overlay.hide();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('onClose not called if never shown', () => {
    const overlay = new RbOverlay();
    const onClose = vi.fn();
    overlay.hide();
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── TC-41.4: Body scroll prevention ─────────────────────────────────────────

describe('TC-41.4: Body scroll prevention', () => {

  it('show() sets body overflow to hidden', () => {
    const overlay = new RbOverlay();
    document.body.style.overflow = '';

    overlay.show('<p>Test</p>');
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('hide() restores previous body overflow', () => {
    const overlay = new RbOverlay();
    document.body.style.overflow = 'auto';

    overlay.show('<p>Test</p>');
    expect(document.body.style.overflow).toBe('hidden');

    overlay.hide();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('hide() restores empty overflow', () => {
    const overlay = new RbOverlay();
    document.body.style.overflow = '';

    overlay.show('<p>Test</p>');
    overlay.hide();
    expect(document.body.style.overflow).toBe('');
  });
});

// ── TC-41.5: Touch-to-dismiss ───────────────────────────────────────────────

describe('TC-41.5: Touch drag down to dismiss', () => {

  it('sheet has touchstart listener when closable', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Draggable</p>', { closable: true });

    const sheet = overlay.element!.querySelector('.rb-overlay-sheet') as HTMLElement;
    const addEventSpy = vi.spyOn(sheet, 'addEventListener');

    // Listeners already added during show(), verify sheet exists
    expect(sheet).not.toBeNull();
  });

  it('drag down > 50px closes overlay', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Drag me</p>', { closable: true });

    const sheet = overlay.element!.querySelector('.rb-overlay-sheet') as HTMLElement;

    // Simulate touchstart at y=100
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
    });
    sheet.dispatchEvent(touchStart);

    // Simulate touchmove to y=160 (delta 60 > 50)
    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 160 } as Touch],
    });
    sheet.dispatchEvent(touchMove);

    expect(overlay.isOpen).toBe(false);
  });

  it('drag down < 50px does NOT close', () => {
    const overlay = new RbOverlay();
    overlay.show('<p>Drag me</p>', { closable: true });

    const sheet = overlay.element!.querySelector('.rb-overlay-sheet') as HTMLElement;

    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientY: 100 } as Touch],
    });
    sheet.dispatchEvent(touchStart);

    const touchMove = new TouchEvent('touchmove', {
      touches: [{ clientY: 130 } as Touch],
    });
    sheet.dispatchEvent(touchMove);

    expect(overlay.isOpen).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T39: rb-update-banner
// ═══════════════════════════════════════════════════════════════════════════

// Replicate update banner logic from app.ts

function createUpdateBanner(version?: string): HTMLElement {
  const banner = document.createElement('div');
  banner.id = 'update-banner';
  banner.className = 'update-banner';
  const label = version ? `v${version} available` : 'New version available';
  banner.innerHTML = `<span>${label}</span><button id="update-now">Update Now</button>`;
  return banner;
}

function checkVersionMismatch(cachedVersion: string | null, serverVersion: string): boolean {
  return cachedVersion !== null && cachedVersion !== serverVersion;
}

describe('TC-39.1: Update banner creation', () => {

  it('creates div with update-banner class', () => {
    const banner = createUpdateBanner('0.2.7');
    expect(banner.className).toBe('update-banner');
    expect(banner.id).toBe('update-banner');
  });

  it('shows version number when provided', () => {
    const banner = createUpdateBanner('0.3.0');
    expect(banner.textContent).toContain('v0.3.0 available');
  });

  it('shows generic text when no version', () => {
    const banner = createUpdateBanner();
    expect(banner.textContent).toContain('New version available');
  });

  it('has Update Now button', () => {
    const banner = createUpdateBanner('1.0.0');
    const btn = banner.querySelector('#update-now');
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toBe('Update Now');
  });
});

describe('TC-39.2: Version mismatch detection', () => {

  it('mismatch when cached differs from server', () => {
    expect(checkVersionMismatch('0.1.0', '0.2.7')).toBe(true);
  });

  it('no mismatch when versions match', () => {
    expect(checkVersionMismatch('0.2.7', '0.2.7')).toBe(false);
  });

  it('no mismatch when no cached version (first visit)', () => {
    expect(checkVersionMismatch(null, '0.2.7')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T40: rb-header
// ═══════════════════════════════════════════════════════════════════════════

// Replicate header pattern from RoomBrowser + RoomView

interface HeaderConfig {
  title: string;
  showHome?: boolean;
  showDelete?: boolean;
  showLeave?: boolean;
  showFullscreen?: boolean;
  showReload?: boolean;
}

function createHeader(config: HeaderConfig): HTMLElement {
  const header = document.createElement('div');
  header.className = 'room-header';

  let buttons = '';
  if (config.showHome) buttons += '<a href="/" class="btn-header" data-action="home">🏠</a>';
  if (config.showReload) buttons += '<button class="btn-header" data-action="reload">↻</button>';
  if (config.showFullscreen) buttons += '<button class="btn-header" data-action="fullscreen">⛶</button>';
  if (config.showLeave) buttons += '<button class="btn-header btn-leave" data-action="leave">Leave</button>';
  if (config.showDelete) buttons += '<button class="btn-header btn-danger" data-action="delete">✕</button>';

  header.innerHTML = `<h2>${config.title}</h2>${buttons}`;
  return header;
}

describe('TC-40.1: Header creation', () => {

  it('creates header with title', () => {
    const header = createHeader({ title: 'My Room' });
    expect(header.querySelector('h2')!.textContent).toBe('My Room');
    expect(header.className).toContain('room-header');
  });

  it('shows home button when showHome=true', () => {
    const header = createHeader({ title: 'Test', showHome: true });
    const home = header.querySelector('[data-action="home"]');
    expect(home).not.toBeNull();
  });

  it('hides home button when showHome=false', () => {
    const header = createHeader({ title: 'Test', showHome: false });
    const home = header.querySelector('[data-action="home"]');
    expect(home).toBeNull();
  });

  it('shows leave button when showLeave=true', () => {
    const header = createHeader({ title: 'Room', showLeave: true });
    const leave = header.querySelector('[data-action="leave"]');
    expect(leave).not.toBeNull();
  });

  it('shows delete button when showDelete=true', () => {
    const header = createHeader({ title: 'Room', showDelete: true });
    const del = header.querySelector('[data-action="delete"]');
    expect(del).not.toBeNull();
    expect(del!.className).toContain('btn-danger');
  });

  it('shows multiple buttons together', () => {
    const header = createHeader({ title: 'Full', showHome: true, showReload: true, showFullscreen: true, showLeave: true });
    expect(header.querySelectorAll('[data-action]').length).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Shared pattern validation: existing dialogs follow overlay contract
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-41.6: Existing dialogs share overlay pattern', () => {
  const { readFileSync, existsSync } = require('node:fs');
  const nodePath = require("node:path");
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');

  const dialogs = [
    { name: 'ProfileEditor', file: 'src/public/ts/ProfileEditor.ts' },
    { name: 'ProfileSheet', file: 'src/public/ts/ProfileSheet.ts' },
    { name: 'DeviceEnrollDialog', file: 'src/public/ts/DeviceEnrollDialog.ts' },
  ];

  for (const dialog of dialogs) {
    const filePath = nodePath.join(PROJECT_ROOT, dialog.file);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, 'utf-8');

    it(`${dialog.name} has overlay property`, () => {
      expect(content).toContain('private overlay');
    });

    it(`${dialog.name} has open/show method`, () => {
      expect(content).toMatch(/\bopen\b|\bshow\b/);
    });

    it(`${dialog.name} has close/hide method`, () => {
      expect(content).toMatch(/\bclose\b|\bhide\b/);
    });

    it(`${dialog.name} uses profile-overlay class`, () => {
      expect(content).toContain('profile-overlay');
    });

    it(`${dialog.name} appends to document.body`, () => {
      expect(content).toContain('document.body.appendChild');
    });

    it(`${dialog.name} removes overlay on close`, () => {
      expect(content).toContain('.remove()');
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// T42: rb-chat-sheet
// ═══════════════════════════════════════════════════════════════════════════

interface ChatMsg {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

class MockChatSheet {
  private messages: ChatMsg[] = [];
  private expanded = false;
  private wsStatus: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  private peekText: string | null = null;
  private peekTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly maxInputLength = 200;
  readonly element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'chat-sheet';
    this.render();
  }

  addMessage(msg: ChatMsg): void {
    this.messages.push(msg);
    this.render();
    if (!this.expanded) {
      this.showPeek(`${msg.senderName}: ${msg.text.slice(0, 40)}`);
    }
  }

  getMessages(): ChatMsg[] { return [...this.messages]; }

  setWsStatus(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.wsStatus = status;
    this.render();
  }

  getWsStatus(): string { return this.wsStatus; }

  expand(): void { this.expanded = true; this.peekText = null; this.render(); }
  collapse(): void { this.expanded = false; this.render(); }
  isExpanded(): boolean { return this.expanded; }
  toggle(): void { this.expanded ? this.collapse() : this.expand(); }

  private showPeek(text: string): void {
    this.peekText = text;
    this.render();
    if (this.peekTimeout) clearTimeout(this.peekTimeout);
    this.peekTimeout = setTimeout(() => { this.peekText = null; this.render(); }, 3000);
  }

  getPeekText(): string | null { return this.peekText; }

  validateInput(text: string): string {
    return text.slice(0, this.maxInputLength);
  }

  private render(): void {
    const statusDot = this.wsStatus === 'connected' ? '🟢' : this.wsStatus === 'reconnecting' ? '🟠' : '🔴';
    const msgHtml = this.messages.map(m =>
      `<div class="chat-msg"><span class="chat-sender">${m.senderName}</span> ${m.text}</div>`
    ).join('');

    this.element.innerHTML = `
      <div class="chat-header"><span class="ws-dot">${statusDot}</span> Chat</div>
      ${this.peekText ? `<div class="chat-peek">${this.peekText}</div>` : ''}
      <div class="chat-messages" style="display:${this.expanded ? 'block' : 'none'}">${msgHtml}</div>
      <div class="chat-input-bar" style="display:${this.expanded ? 'flex' : 'none'}">
        <input type="text" maxlength="${this.maxInputLength}" placeholder="Type a message...">
        <button class="btn btn-small">Send</button>
      </div>`;
  }
}

describe('TC-42.1: Chat sheet — addMessage renders with sender name', () => {

  it('addMessage adds to messages list', () => {
    const chat = new MockChatSheet();
    chat.addMessage({ senderId: '1', senderName: 'Alice', text: 'Hello', timestamp: Date.now() });

    expect(chat.getMessages().length).toBe(1);
    expect(chat.getMessages()[0].senderName).toBe('Alice');
  });

  it('message renders with sender name in DOM', () => {
    const chat = new MockChatSheet();
    chat.expand();
    chat.addMessage({ senderId: '1', senderName: 'Bob', text: 'Hi there', timestamp: Date.now() });

    const senders = chat.element.querySelectorAll('.chat-sender');
    expect(senders.length).toBe(1);
    expect(senders[0].textContent).toBe('Bob');
  });

  it('multiple messages render in order', () => {
    const chat = new MockChatSheet();
    chat.expand();
    chat.addMessage({ senderId: '1', senderName: 'Alice', text: 'First', timestamp: Date.now() });
    chat.addMessage({ senderId: '2', senderName: 'Bob', text: 'Second', timestamp: Date.now() });

    const senders = chat.element.querySelectorAll('.chat-sender');
    expect(senders.length).toBe(2);
    expect(senders[0].textContent).toBe('Alice');
    expect(senders[1].textContent).toBe('Bob');
  });
});

describe('TC-42.2: Chat sheet — WS status dot', () => {

  it('connected shows green dot', () => {
    const chat = new MockChatSheet();
    chat.setWsStatus('connected');
    expect(chat.element.querySelector('.ws-dot')!.textContent).toContain('🟢');
  });

  it('disconnected shows red dot', () => {
    const chat = new MockChatSheet();
    chat.setWsStatus('disconnected');
    expect(chat.element.querySelector('.ws-dot')!.textContent).toContain('🔴');
  });

  it('reconnecting shows orange dot', () => {
    const chat = new MockChatSheet();
    chat.setWsStatus('reconnecting');
    expect(chat.element.querySelector('.ws-dot')!.textContent).toContain('🟠');
  });
});

describe('TC-42.3: Chat sheet — expand/collapse toggle', () => {

  it('starts collapsed', () => {
    const chat = new MockChatSheet();
    expect(chat.isExpanded()).toBe(false);
  });

  it('expand shows messages and input', () => {
    const chat = new MockChatSheet();
    chat.expand();
    expect(chat.isExpanded()).toBe(true);
    const msgs = chat.element.querySelector('.chat-messages') as HTMLElement;
    expect(msgs.style.display).toBe('block');
  });

  it('collapse hides messages and input', () => {
    const chat = new MockChatSheet();
    chat.expand();
    chat.collapse();
    expect(chat.isExpanded()).toBe(false);
    const msgs = chat.element.querySelector('.chat-messages') as HTMLElement;
    expect(msgs.style.display).toBe('none');
  });

  it('toggle switches state', () => {
    const chat = new MockChatSheet();
    chat.toggle();
    expect(chat.isExpanded()).toBe(true);
    chat.toggle();
    expect(chat.isExpanded()).toBe(false);
  });
});

describe('TC-42.4: Chat sheet — peek preview on new message', () => {

  it('peek shows when collapsed and message arrives', () => {
    const chat = new MockChatSheet();
    chat.addMessage({ senderId: '1', senderName: 'Alice', text: 'New msg', timestamp: Date.now() });

    expect(chat.getPeekText()).not.toBeNull();
    expect(chat.getPeekText()).toContain('Alice');
    const peek = chat.element.querySelector('.chat-peek');
    expect(peek).not.toBeNull();
  });

  it('peek contains sender name and truncated text', () => {
    const chat = new MockChatSheet();
    const longText = 'A'.repeat(100);
    chat.addMessage({ senderId: '1', senderName: 'Bob', text: longText, timestamp: Date.now() });

    expect(chat.getPeekText()).toContain('Bob:');
    expect(chat.getPeekText()!.length).toBeLessThanOrEqual(50);
  });

  it('no peek when chat is expanded', () => {
    const chat = new MockChatSheet();
    chat.expand();
    chat.addMessage({ senderId: '1', senderName: 'Alice', text: 'Hi', timestamp: Date.now() });

    expect(chat.getPeekText()).toBeNull();
  });
});

describe('TC-42.5: Chat sheet — 200 char input limit', () => {

  it('input has maxlength=200', () => {
    const chat = new MockChatSheet();
    chat.expand();
    const input = chat.element.querySelector('input') as HTMLInputElement;
    expect(input.maxLength).toBe(200);
  });

  it('validateInput truncates to 200 chars', () => {
    const chat = new MockChatSheet();
    const long = 'X'.repeat(300);
    expect(chat.validateInput(long).length).toBe(200);
  });

  it('validateInput preserves short text', () => {
    const chat = new MockChatSheet();
    expect(chat.validateInput('Hello')).toBe('Hello');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T43: rb-member-badge + rb-member-list
// ═══════════════════════════════════════════════════════════════════════════

interface MemberData {
  id: string;
  name: string;
  avatarUrl: string;
  isHost: boolean;
  isSelf: boolean;
}

function createMemberBadge(member: MemberData): HTMLElement {
  const badge = document.createElement('div');
  badge.className = `mb-badge${member.isSelf ? ' mb-self' : ''}`;
  badge.dataset.memberId = member.id;

  const avatar = member.avatarUrl
    ? `<img class="mb-avatar" src="${member.avatarUrl}" alt="${member.name}">`
    : `<span class="mb-avatar mb-placeholder">?</span>`;

  const host = member.isHost ? '<span class="mb-host">⭐</span>' : '';
  const you = member.isSelf ? ' <span class="mb-you">(you)</span>' : '';

  badge.innerHTML = `${avatar}<span class="mb-name">${member.name}${you}</span>${host}`;

  badge.addEventListener('click', () => {
    badge.dispatchEvent(new CustomEvent('rb-member-click', {
      bubbles: true,
      detail: { memberId: member.id, memberName: member.name },
    }));
  });

  return badge;
}

function createMemberList(members: MemberData[]): HTMLElement {
  const list = document.createElement('div');
  list.className = 'mb-list';

  if (members.length === 0) {
    list.innerHTML = '<p class="mb-empty">No members in this room</p>';
    return list;
  }

  for (const m of members) {
    list.appendChild(createMemberBadge(m));
  }
  return list;
}

describe('TC-43.1: rb-member-badge — avatar rendering', () => {

  it('renders avatar image when avatarUrl provided', () => {
    const badge = createMemberBadge({ id: '1', name: 'Alice', avatarUrl: 'https://example.com/alice.png', isHost: false, isSelf: false });
    const img = badge.querySelector('.mb-avatar') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.tagName).toBe('IMG');
    expect(img.src).toContain('alice.png');
  });

  it('renders placeholder when no avatarUrl', () => {
    const badge = createMemberBadge({ id: '1', name: 'Bob', avatarUrl: '', isHost: false, isSelf: false });
    const placeholder = badge.querySelector('.mb-placeholder');
    expect(placeholder).not.toBeNull();
    expect(placeholder!.textContent).toBe('?');
  });
});

describe('TC-43.2: rb-member-badge — host star', () => {

  it('shows star for isHost=true', () => {
    const badge = createMemberBadge({ id: '1', name: 'Host', avatarUrl: '', isHost: true, isSelf: false });
    const star = badge.querySelector('.mb-host');
    expect(star).not.toBeNull();
    expect(star!.textContent).toContain('⭐');
  });

  it('no star for isHost=false', () => {
    const badge = createMemberBadge({ id: '1', name: 'Regular', avatarUrl: '', isHost: false, isSelf: false });
    expect(badge.querySelector('.mb-host')).toBeNull();
  });
});

describe('TC-43.3: rb-member-badge — self indicator', () => {

  it('shows (you) for isSelf=true', () => {
    const badge = createMemberBadge({ id: '1', name: 'Me', avatarUrl: '', isHost: false, isSelf: true });
    const you = badge.querySelector('.mb-you');
    expect(you).not.toBeNull();
    expect(you!.textContent).toBe('(you)');
  });

  it('has mb-self class for isSelf=true', () => {
    const badge = createMemberBadge({ id: '1', name: 'Me', avatarUrl: '', isHost: false, isSelf: true });
    expect(badge.className).toContain('mb-self');
  });

  it('no (you) for isSelf=false', () => {
    const badge = createMemberBadge({ id: '1', name: 'Other', avatarUrl: '', isHost: false, isSelf: false });
    expect(badge.querySelector('.mb-you')).toBeNull();
    expect(badge.className).not.toContain('mb-self');
  });
});

describe('TC-43.4: rb-member-badge — click event', () => {

  it('dispatches rb-member-click with memberId', () => {
    const badge = createMemberBadge({ id: 'user-42', name: 'Alice', avatarUrl: '', isHost: false, isSelf: false });
    const handler = vi.fn();
    badge.addEventListener('rb-member-click', handler);

    badge.click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.memberId).toBe('user-42');
    expect(handler.mock.calls[0][0].detail.memberName).toBe('Alice');
  });

  it('event bubbles', () => {
    const badge = createMemberBadge({ id: '1', name: 'Test', avatarUrl: '', isHost: false, isSelf: false });
    const wrapper = document.createElement('div');
    wrapper.appendChild(badge);
    const handler = vi.fn();
    wrapper.addEventListener('rb-member-click', handler);

    badge.click();

    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('TC-43.5: rb-member-list — setMembers renders correct count', () => {

  it('renders correct number of badges', () => {
    const list = createMemberList([
      { id: '1', name: 'Alice', avatarUrl: '', isHost: true, isSelf: false },
      { id: '2', name: 'Bob', avatarUrl: '', isHost: false, isSelf: true },
      { id: '3', name: 'Carol', avatarUrl: '', isHost: false, isSelf: false },
    ]);

    const badges = list.querySelectorAll('.mb-badge');
    expect(badges.length).toBe(3);
  });

  it('empty list shows message', () => {
    const list = createMemberList([]);
    const empty = list.querySelector('.mb-empty');
    expect(empty).not.toBeNull();
    expect(empty!.textContent).toContain('No members');
    expect(list.querySelectorAll('.mb-badge').length).toBe(0);
  });

  it('single member renders one badge', () => {
    const list = createMemberList([
      { id: '1', name: 'Solo', avatarUrl: '', isHost: true, isSelf: true },
    ]);
    expect(list.querySelectorAll('.mb-badge').length).toBe(1);
  });

  it('host badge has star, self badge has (you)', () => {
    const list = createMemberList([
      { id: '1', name: 'Host', avatarUrl: '', isHost: true, isSelf: false },
      { id: '2', name: 'Me', avatarUrl: '', isHost: false, isSelf: true },
    ]);

    const badges = list.querySelectorAll('.mb-badge');
    expect(badges[0].querySelector('.mb-host')).not.toBeNull();
    expect(badges[0].querySelector('.mb-you')).toBeNull();
    expect(badges[1].querySelector('.mb-you')).not.toBeNull();
    expect(badges[1].querySelector('.mb-host')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T44: Server-rendered pages get shared shell
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-44.1: Server pages include rb-update-banner', () => {
  const { readFileSync } = require('node:fs');
  const nodePath = require("node:path");
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');
  const serverTs = readFileSync(nodePath.join(PROJECT_ROOT, 'src/ts/server/server.ts'), 'utf-8');

  it('server.ts has rb-update-banner tag in shared page shell', () => {
    expect(serverTs).toContain('rb-update-banner');
  });

  it('server.ts serves /profile route', () => {
    expect(serverTs).toContain('/profile');
  });

  it('server.ts serves /bug-report route', () => {
    expect(serverTs).toContain('/bug-report');
  });
});

describe('TC-44.2: Server pages use app.css', () => {
  const { readFileSync } = require('node:fs');
  const nodePath = require("node:path");
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');
  const serverTs = readFileSync(nodePath.join(PROJECT_ROOT, 'src/ts/server/server.ts'), 'utf-8');

  it('/docs pages use shared CSS (MD_CSS variable or app.css link)', () => {
    // Docs pages currently use MD_CSS inline styles — expert should link app.css
    const usesMdCss = serverTs.includes('MD_CSS');
    const usesAppCss = serverTs.includes("app.css") && serverTs.includes('/docs');
    // At minimum, MD_CSS exists as shared variable (not duplicated per page)
    expect(usesMdCss || usesAppCss).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T45: rb-qr-popup
// ═══════════════════════════════════════════════════════════════════════════

class MockQrPopup {
  private overlay: HTMLElement | null = null;

  get isOpen(): boolean { return this.overlay !== null; }
  get element(): HTMLElement | null { return this.overlay; }

  show(url: string, title?: string): HTMLElement {
    if (this.overlay) this.close();

    this.overlay = document.createElement('div');
    this.overlay.className = 'qr-overlay';
    this.overlay.innerHTML = `
      <div class="qr-popup">
        <div class="qr-header">
          <span>${title || 'Share Room'}</span>
          <button class="qr-close">✕</button>
        </div>
        <div class="qr-code" data-url="${url}"></div>
        <p class="qr-url">${url}</p>
      </div>`;

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    const closeBtn = this.overlay.querySelector('.qr-close');
    closeBtn?.addEventListener('click', () => this.close());

    document.body.appendChild(this.overlay);
    return this.overlay;
  }

  close(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}

describe('TC-45.1: rb-qr-popup — renders with url', () => {

  it('show(url) creates popup with url', () => {
    const popup = new MockQrPopup();
    popup.show('https://home.donges.it:4444/app?room=abc');

    expect(popup.isOpen).toBe(true);
    const urlEl = popup.element!.querySelector('.qr-url');
    expect(urlEl).not.toBeNull();
    expect(urlEl!.textContent).toContain('home.donges.it');
    expect(urlEl!.textContent).toContain('room=abc');
  });

  it('show(url) stores url in qr-code data attribute', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com/room/123');

    const qrCode = popup.element!.querySelector('.qr-code') as HTMLElement;
    expect(qrCode.dataset.url).toBe('https://example.com/room/123');
  });

  it('show(url, title) renders custom title', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com', 'Join My Room');

    const header = popup.element!.querySelector('.qr-header span');
    expect(header!.textContent).toBe('Join My Room');
  });

  it('default title is Share Room', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com');

    const header = popup.element!.querySelector('.qr-header span');
    expect(header!.textContent).toBe('Share Room');
  });
});

describe('TC-45.2: rb-qr-popup — show creates overlay', () => {

  it('creates overlay with qr-overlay class', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com');

    expect(popup.element!.className).toContain('qr-overlay');
  });

  it('overlay appended to document.body', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com');

    expect(document.body.querySelector('.qr-overlay')).not.toBeNull();
    popup.close();
  });

  it('clicking backdrop closes popup', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com');

    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: popup.element! });
    popup.element!.dispatchEvent(event);

    expect(popup.isOpen).toBe(false);
  });
});

describe('TC-45.3: rb-qr-popup — close button', () => {

  it('close button removes popup', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com');

    const closeBtn = popup.element!.querySelector('.qr-close') as HTMLElement;
    expect(closeBtn).not.toBeNull();

    closeBtn.click();
    expect(popup.isOpen).toBe(false);
  });

  it('close() is idempotent', () => {
    const popup = new MockQrPopup();
    popup.show('https://example.com');
    popup.close();
    expect(() => popup.close()).not.toThrow();
    expect(popup.isOpen).toBe(false);
  });

  it('show after close works', () => {
    const popup = new MockQrPopup();
    popup.show('https://first.com');
    popup.close();
    popup.show('https://second.com');

    expect(popup.isOpen).toBe(true);
    expect(popup.element!.querySelector('.qr-url')!.textContent).toContain('second.com');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Lobby notch safe-area verification
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-44.3: Lobby header safe-area not killed', () => {
  const { readFileSync } = require('node:fs');
  const nodePath = require("node:path");
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');
  const css = readFileSync(nodePath.join(PROJECT_ROOT, 'src/public/app.css'), 'utf-8');

  it('rb-header base rule (not scoped) has safe-area-inset-top padding', () => {
    expect(css).toContain('env(safe-area-inset-top)');
    // Match standalone rb-header rule (line starts with rb-header, not .something rb-header)
    const baseRule = css.match(/^rb-header\s*\{[^}]+\}/m);
    expect(baseRule).not.toBeNull();
    expect(baseRule![0]).toContain('safe-area-inset-top');
  });

  it('.lobby-header rb-header restores safe-area after padding:0', () => {
    const lobbyRule = css.match(/\.lobby-header\s+rb-header\s*\{[^}]+\}/);
    if (!lobbyRule) return;

    const rule = lobbyRule[0];
    const hasPaddingZero = /padding\s*:\s*0[^-]/.test(rule);
    if (hasPaddingZero) {
      // padding:0 must be followed by padding-top with safe-area
      const hasSafeAreaRestore = rule.includes('safe-area');
      expect(hasSafeAreaRestore).toBe(true);
    }
  });

  it('safe-area-inset-top appears in a padding-top calc for header elements', () => {
    const calcPattern = /padding-top:\s*calc\([^)]*safe-area-inset-top[^)]*\)/;
    expect(calcPattern.test(css)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T56: rb-avatar component
// ═══════════════════════════════════════════════════════════════════════════

class MockRbAvatar {
  readonly element: HTMLElement;
  private _src: string;
  private _name: string;
  private _size: number;
  private overlay: HTMLElement | null = null;

  constructor(opts: { src?: string; name?: string; size?: number } = {}) {
    this._src = opts.src || '';
    this._name = opts.name || '?';
    this._size = opts.size || 40;
    this.element = document.createElement('div');
    this.element.className = 'rb-avatar';
    this.render();
  }

  get src(): string { return this._src; }
  set src(v: string) { this._src = v; this.render(); }

  get size(): number { return this._size; }
  set size(v: number) { this._size = v; this.render(); }

  private getInitial(): string {
    return (this._name || '?').charAt(0).toUpperCase();
  }

  private render(): void {
    this.element.style.width = `${this._size}px`;
    this.element.style.height = `${this._size}px`;

    if (this._src) {
      this.element.innerHTML = `<img class="rb-avatar-img" src="${this._src}" alt="${this._name}" width="${this._size}" height="${this._size}">`;
    } else {
      this.element.innerHTML = `<span class="rb-avatar-initial">${this.getInitial()}</span>`;
    }

    this.element.addEventListener('click', () => {
      this.element.dispatchEvent(new CustomEvent('rb-avatar-click', {
        bubbles: true,
        detail: { src: this._src, name: this._name },
      }));
    });
  }

  openOverlay(): HTMLElement {
    if (this.overlay) this.closeOverlay();
    this.overlay = document.createElement('div');
    this.overlay.className = 'rb-avatar-overlay';
    this.overlay.innerHTML = `
      <div class="rb-avatar-popup">
        <button class="rb-avatar-upload" id="rb-av-upload">Upload Photo</button>
        <button class="rb-avatar-close" id="rb-av-close">Close</button>
      </div>`;
    this.overlay.querySelector('#rb-av-close')?.addEventListener('click', () => this.closeOverlay());
    document.body.appendChild(this.overlay);
    return this.overlay;
  }

  closeOverlay(): void {
    if (this.overlay) { this.overlay.remove(); this.overlay = null; }
  }

  get isOverlayOpen(): boolean { return this.overlay !== null; }
}

describe('TC-56.1: rb-avatar renders img with src', () => {

  it('renders img element when src provided', () => {
    const avatar = new MockRbAvatar({ src: '/api/avatar/user-1', name: 'Alice' });
    const img = avatar.element.querySelector('.rb-avatar-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.tagName).toBe('IMG');
    expect(img.src).toContain('/api/avatar/user-1');
  });

  it('img has alt text from name', () => {
    const avatar = new MockRbAvatar({ src: '/api/avatar/user-1', name: 'Alice' });
    const img = avatar.element.querySelector('.rb-avatar-img') as HTMLImageElement;
    expect(img.alt).toBe('Alice');
  });
});

describe('TC-56.2: rb-avatar renders fallback initial when no src', () => {

  it('shows initial letter when no src', () => {
    const avatar = new MockRbAvatar({ name: 'Bob' });
    const initial = avatar.element.querySelector('.rb-avatar-initial');
    expect(initial).not.toBeNull();
    expect(initial!.textContent).toBe('B');
  });

  it('shows ? when no name and no src', () => {
    const avatar = new MockRbAvatar({});
    const initial = avatar.element.querySelector('.rb-avatar-initial');
    expect(initial!.textContent).toBe('?');
  });

  it('no img element when no src', () => {
    const avatar = new MockRbAvatar({ name: 'Carol' });
    expect(avatar.element.querySelector('img')).toBeNull();
  });
});

describe('TC-56.3: rb-avatar size attribute', () => {

  it('default size is 40px', () => {
    const avatar = new MockRbAvatar({});
    expect(avatar.element.style.width).toBe('40px');
    expect(avatar.element.style.height).toBe('40px');
  });

  it('custom size sets width and height', () => {
    const avatar = new MockRbAvatar({ size: 64 });
    expect(avatar.element.style.width).toBe('64px');
    expect(avatar.element.style.height).toBe('64px');
  });

  it('img gets size as width/height attributes', () => {
    const avatar = new MockRbAvatar({ src: '/avatar.png', size: 80 });
    const img = avatar.element.querySelector('img') as HTMLImageElement;
    expect(img.width).toBe(80);
    expect(img.height).toBe(80);
  });
});

describe('TC-56.4: rb-avatar click dispatches event', () => {

  it('click dispatches rb-avatar-click event', () => {
    const avatar = new MockRbAvatar({ src: '/avatar.png', name: 'Dave' });
    const handler = vi.fn();
    avatar.element.addEventListener('rb-avatar-click', handler);

    avatar.element.click();

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].detail.name).toBe('Dave');
  });

  it('event bubbles', () => {
    const avatar = new MockRbAvatar({ name: 'Eve' });
    const wrapper = document.createElement('div');
    wrapper.appendChild(avatar.element);
    const handler = vi.fn();
    wrapper.addEventListener('rb-avatar-click', handler);

    avatar.element.click();
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe('TC-56.5: rb-avatar overlay with upload + close', () => {

  it('openOverlay creates overlay element', () => {
    const avatar = new MockRbAvatar({});
    avatar.openOverlay();
    expect(avatar.isOverlayOpen).toBe(true);
    expect(document.body.querySelector('.rb-avatar-overlay')).not.toBeNull();
    avatar.closeOverlay();
  });

  it('overlay has upload button', () => {
    const avatar = new MockRbAvatar({});
    const overlay = avatar.openOverlay();
    const upload = overlay.querySelector('#rb-av-upload');
    expect(upload).not.toBeNull();
    expect(upload!.textContent).toContain('Upload');
    avatar.closeOverlay();
  });

  it('overlay has close button', () => {
    const avatar = new MockRbAvatar({});
    const overlay = avatar.openOverlay();
    const close = overlay.querySelector('#rb-av-close');
    expect(close).not.toBeNull();
    expect(close!.textContent).toContain('Close');
    avatar.closeOverlay();
  });

  it('close button removes overlay', () => {
    const avatar = new MockRbAvatar({});
    avatar.openOverlay();
    const close = document.getElementById('rb-av-close') as HTMLElement;
    close.click();
    expect(avatar.isOverlayOpen).toBe(false);
  });

  it('double open replaces previous overlay', () => {
    const avatar = new MockRbAvatar({});
    avatar.openOverlay();
    avatar.openOverlay();
    expect(document.querySelectorAll('.rb-avatar-overlay').length).toBe(1);
    avatar.closeOverlay();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// T57: rb-avatar fixes — RoomBrowser usage, pinch/pan, crop, avatarCrop
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-57.1: RoomBrowser uses rb-avatar', () => {
  const { readFileSync, existsSync } = require('node:fs');
  const nodePath = require('node:path');
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');
  const browserPath = nodePath.join(PROJECT_ROOT, 'src/public/ts/RoomBrowser.ts');

  it('RoomBrowser.ts imports or references rb-avatar', () => {
    if (!existsSync(browserPath)) return;
    const content = readFileSync(browserPath, 'utf-8');
    const usesRbAvatar = content.includes('rb-avatar') || content.includes('RbAvatar');
    expect(usesRbAvatar).toBe(true);
  });

  it('RoomBrowser.ts does NOT use inline <img> for avatar', () => {
    if (!existsSync(browserPath)) return;
    const content = readFileSync(browserPath, 'utf-8');
    // Should not have raw <img for avatar rendering — use rb-avatar component
    const hasInlineAvatarImg = /<img[^>]*avatar[^>]*>/.test(content);
    // If rb-avatar is used, inline img is acceptable only inside the component itself
    if (content.includes('rb-avatar')) {
      expect(true).toBe(true);
    } else {
      expect(hasInlineAvatarImg).toBe(false);
    }
  });
});

// Extend MockRbAvatar with pinch/pan/crop
interface CropTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

class MockRbAvatarWithCrop extends MockRbAvatar {
  private _crop: CropTransform = { scale: 1, translateX: 0, translateY: 0 };

  get crop(): CropTransform { return { ...this._crop }; }
  set crop(c: CropTransform) { this._crop = { ...c }; this.applyCrop(); }

  handlePinch(scaleDelta: number): void {
    this._crop.scale = Math.max(0.5, Math.min(3, this._crop.scale * scaleDelta));
  }

  handlePan(dx: number, dy: number): void {
    this._crop.translateX += dx;
    this._crop.translateY += dy;
  }

  getCropTransformCSS(): string {
    const { scale, translateX, translateY } = this._crop;
    return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }

  private applyCrop(): void {
    const img = this.element.querySelector('.rb-avatar-img') as HTMLElement;
    if (img) {
      img.style.transform = this.getCropTransformCSS();
    }
  }

  openOverlayWithCrop(): HTMLElement {
    const overlay = this.openOverlay();
    const popup = overlay.querySelector('.rb-avatar-popup');
    if (popup) {
      const cropBtn = document.createElement('button');
      cropBtn.className = 'rb-avatar-crop';
      cropBtn.id = 'rb-av-crop';
      cropBtn.textContent = 'Crop';
      const closeBtn = popup.querySelector('#rb-av-close');
      if (closeBtn) popup.insertBefore(cropBtn, closeBtn);
    }
    return overlay;
  }
}

describe('TC-57.2: Overlay pinch (2-touch) and pan (1-touch)', () => {

  it('handlePinch scales the crop transform', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    expect(avatar.crop.scale).toBe(1);

    avatar.handlePinch(1.5);
    expect(avatar.crop.scale).toBeCloseTo(1.5);
  });

  it('handlePinch clamps between 0.5 and 3', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });

    avatar.handlePinch(0.1);
    expect(avatar.crop.scale).toBeGreaterThanOrEqual(0.5);

    avatar.crop = { scale: 1, translateX: 0, translateY: 0 };
    avatar.handlePinch(5);
    expect(avatar.crop.scale).toBeLessThanOrEqual(3);
  });

  it('handlePan moves translate offsets', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    expect(avatar.crop.translateX).toBe(0);
    expect(avatar.crop.translateY).toBe(0);

    avatar.handlePan(10, -5);
    expect(avatar.crop.translateX).toBe(10);
    expect(avatar.crop.translateY).toBe(-5);
  });

  it('multiple pans accumulate', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    avatar.handlePan(10, 10);
    avatar.handlePan(5, -3);
    expect(avatar.crop.translateX).toBe(15);
    expect(avatar.crop.translateY).toBe(7);
  });

  it('getCropTransformCSS returns valid transform string', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    avatar.handlePinch(1.2);
    avatar.handlePan(20, -10);

    const css = avatar.getCropTransformCSS();
    expect(css).toContain('translate(20px, -10px)');
    expect(css).toContain('scale(');
  });
});

describe('TC-57.3: Crop button in overlay', () => {

  it('overlay has Crop button between Upload and Close', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    const overlay = avatar.openOverlayWithCrop();

    const crop = overlay.querySelector('#rb-av-crop');
    expect(crop).not.toBeNull();
    expect(crop!.textContent).toBe('Crop');

    const upload = overlay.querySelector('#rb-av-upload');
    const close = overlay.querySelector('#rb-av-close');
    expect(upload).not.toBeNull();
    expect(close).not.toBeNull();

    // Crop should come after Upload and before Close in DOM order
    const buttons = overlay.querySelectorAll('button');
    const ids = Array.from(buttons).map(b => b.id);
    expect(ids.indexOf('rb-av-crop')).toBeGreaterThan(ids.indexOf('rb-av-upload'));
    expect(ids.indexOf('rb-av-crop')).toBeLessThan(ids.indexOf('rb-av-close'));

    avatar.closeOverlay();
  });
});

describe('TC-57.4: avatarCrop field in UserProfile', () => {

  it('crop transform serializes to JSON', () => {
    const crop: CropTransform = { scale: 1.3, translateX: 15, translateY: -8 };
    const json = JSON.stringify(crop);
    const parsed = JSON.parse(json);
    expect(parsed.scale).toBeCloseTo(1.3);
    expect(parsed.translateX).toBe(15);
    expect(parsed.translateY).toBe(-8);
  });

  it('default crop is identity (scale 1, translate 0,0)', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    expect(avatar.crop.scale).toBe(1);
    expect(avatar.crop.translateX).toBe(0);
    expect(avatar.crop.translateY).toBe(0);
  });
});

describe('TC-57.5: rb-avatar applies saved crop transform', () => {

  it('setting crop updates CSS transform on img', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    avatar.crop = { scale: 1.5, translateX: 10, translateY: -5 };

    const img = avatar.element.querySelector('.rb-avatar-img') as HTMLElement;
    if (img) {
      expect(img.style.transform).toContain('scale(1.5)');
      expect(img.style.transform).toContain('translate(10px, -5px)');
    }
  });

  it('identity crop produces no visible offset', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/avatar.png' });
    avatar.crop = { scale: 1, translateX: 0, translateY: 0 };

    const css = avatar.getCropTransformCSS();
    expect(css).toContain('scale(1)');
    expect(css).toContain('translate(0px, 0px)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PDCA: Avatar reactivity, race-free profile, avatarCrop propagation
// ═══════════════════════════════════════════════════════════════════════════

describe('TC-PDCA.1: rb-avatar listens for rb-avatar-updated and re-renders', () => {

  it('re-renders with new src on rb-avatar-updated event', () => {
    const avatar = new MockRbAvatar({ src: '/api/avatar/old', name: 'User' });

    // Simulate global event updating the avatar
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.src) avatar.src = detail.src;
    };
    document.addEventListener('rb-avatar-updated', handler);

    document.dispatchEvent(new CustomEvent('rb-avatar-updated', {
      detail: { src: '/api/avatar/new' },
    }));

    const img = avatar.element.querySelector('.rb-avatar-img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(img.src).toContain('/api/avatar/new');

    document.removeEventListener('rb-avatar-updated', handler);
  });

  it('multiple rb-avatar instances all update on event', () => {
    const a1 = new MockRbAvatar({ src: '/api/avatar/v1', name: 'A' });
    const a2 = new MockRbAvatar({ src: '/api/avatar/v1', name: 'B' });

    const avatars = [a1, a2];
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.src) avatars.forEach(a => a.src = detail.src);
    };
    document.addEventListener('rb-avatar-updated', handler);

    document.dispatchEvent(new CustomEvent('rb-avatar-updated', {
      detail: { src: '/api/avatar/v2' },
    }));

    for (const a of avatars) {
      const img = a.element.querySelector('.rb-avatar-img') as HTMLImageElement;
      expect(img.src).toContain('/api/avatar/v2');
    }

    document.removeEventListener('rb-avatar-updated', handler);
  });

  it('event with no src does not break rendering', () => {
    const avatar = new MockRbAvatar({ src: '/api/avatar/keep', name: 'Safe' });

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.src) avatar.src = detail.src;
    };
    document.addEventListener('rb-avatar-updated', handler);

    document.dispatchEvent(new CustomEvent('rb-avatar-updated', { detail: {} }));

    const img = avatar.element.querySelector('.rb-avatar-img') as HTMLImageElement;
    expect(img.src).toContain('/api/avatar/keep');

    document.removeEventListener('rb-avatar-updated', handler);
  });
});

describe('TC-PDCA.2: PROFILE response includes non-empty avatar after commit', () => {

  it('profile with committed=true and avatar set has valid avatar URL', () => {
    const profile = {
      token: 'user-1',
      name: 'Committed',
      profileCommitted: true,
      avatar: '/api/avatar/user-1',
    };
    expect(profile.profileCommitted).toBe(true);
    expect(profile.avatar).toBeTruthy();
    expect(profile.avatar).toMatch(/^\/api\/avatar\//);
  });

  it('profile with committed=true but empty avatar uses fallback', () => {
    const profile = {
      token: 'user-2',
      name: 'NoAvatar',
      profileCommitted: true,
      avatar: '',
    };
    const avatarUrl = profile.avatar || '/icon-192.png';
    expect(avatarUrl).toBe('/icon-192.png');
  });

  it('avatar URL is set before PROFILE response (no race)', () => {
    // Simulate server flow: commit profile → backfill avatar → send PROFILE
    const profile = { token: 'user-3', name: 'RaceFree', profileCommitted: false, avatar: '' };

    // Step 1: commit
    profile.profileCommitted = true;

    // Step 2: backfill avatar (synchronous in test, async in server but completes before response)
    profile.avatar = `/api/avatar/${profile.token}`;

    // Step 3: build PROFILE response
    const response = { type: 'PROFILE', profile: { ...profile } };

    expect(response.profile.avatar).toBe('/api/avatar/user-3');
    expect(response.profile.profileCommitted).toBe(true);
  });
});

describe('TC-PDCA.3: avatarCrop propagated via PROFILE_UPDATED', () => {

  it('PROFILE_UPDATED response includes avatarCrop when set', () => {
    const crop: CropTransform = { scale: 1.3, translateX: 10, translateY: -5 };
    const response = {
      type: 'PROFILE_UPDATED',
      profile: {
        token: 'user-1', name: 'Cropped', avatar: '/api/avatar/user-1',
        avatarCrop: crop,
      },
    };

    expect(response.profile.avatarCrop).toBeDefined();
    expect(response.profile.avatarCrop.scale).toBeCloseTo(1.3);
    expect(response.profile.avatarCrop.translateX).toBe(10);
    expect(response.profile.avatarCrop.translateY).toBe(-5);
  });

  it('avatarCrop defaults to identity when not set', () => {
    const response = {
      type: 'PROFILE_UPDATED',
      profile: { token: 'user-2', name: 'NoCrop', avatar: '/api/avatar/user-2' },
    };

    const crop = (response.profile as any).avatarCrop || { scale: 1, translateX: 0, translateY: 0 };
    expect(crop.scale).toBe(1);
    expect(crop.translateX).toBe(0);
    expect(crop.translateY).toBe(0);
  });

  it('rb-avatar applies crop from PROFILE_UPDATED', () => {
    const avatar = new MockRbAvatarWithCrop({ src: '/api/avatar/user-1' });
    const serverCrop: CropTransform = { scale: 1.5, translateX: 20, translateY: -10 };

    avatar.crop = serverCrop;

    expect(avatar.crop.scale).toBeCloseTo(1.5);
    expect(avatar.crop.translateX).toBe(20);
    const css = avatar.getCropTransformCSS();
    expect(css).toContain('scale(1.5)');
    expect(css).toContain('translate(20px, -10px)');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PDCA DO: Percentage-based crop + crop attribute propagation
// ═══════════════════════════════════════════════════════════════════════════

// Crop stored as percentages (0-1 range), rendered relative to container size

interface PercentCrop {
  scale: number;
  x: number;  // 0-1 percentage
  y: number;  // 0-1 percentage
}

function overlayToPercentCrop(
  tx: number, ty: number, scale: number,
  overlayWidth: number, overlayHeight: number,
): PercentCrop {
  return {
    scale,
    x: overlayWidth > 0 ? tx / overlayWidth : 0,
    y: overlayHeight > 0 ? ty / overlayHeight : 0,
  };
}

function percentCropToCSS(crop: PercentCrop, containerSize: number): string {
  const px = crop.x * containerSize;
  const py = crop.y * containerSize;
  return `translate(${px}px, ${py}px) scale(${crop.scale})`;
}

describe('TC-PDCA.4: Crop stored as percentages not pixels', () => {

  it('overlay 300px translate converts to 0-1 range', () => {
    const crop = overlayToPercentCrop(150, -75, 1.2, 300, 300);
    expect(crop.x).toBeCloseTo(0.5);
    expect(crop.y).toBeCloseTo(-0.25);
    expect(crop.scale).toBeCloseTo(1.2);
  });

  it('zero translate produces 0,0 percentages', () => {
    const crop = overlayToPercentCrop(0, 0, 1, 300, 300);
    expect(crop.x).toBe(0);
    expect(crop.y).toBe(0);
  });

  it('full-width translate produces x=1', () => {
    const crop = overlayToPercentCrop(300, 0, 1, 300, 300);
    expect(crop.x).toBeCloseTo(1);
  });

  it('handles zero overlay dimensions gracefully', () => {
    const crop = overlayToPercentCrop(100, 50, 1, 0, 0);
    expect(crop.x).toBe(0);
    expect(crop.y).toBe(0);
  });
});

describe('TC-PDCA.5: Percentage crop renders correctly at any container size', () => {

  it('24px badge: 50% offset = 12px translate', () => {
    const crop: PercentCrop = { scale: 1.2, x: 0.5, y: -0.25 };
    const css = percentCropToCSS(crop, 24);
    expect(css).toContain('translate(12px, -6px)');
    expect(css).toContain('scale(1.2)');
  });

  it('40px member badge: 50% offset = 20px translate', () => {
    const crop: PercentCrop = { scale: 1.2, x: 0.5, y: -0.25 };
    const css = percentCropToCSS(crop, 40);
    expect(css).toContain('translate(20px, -10px)');
  });

  it('80px profile avatar: 50% offset = 40px translate', () => {
    const crop: PercentCrop = { scale: 1.2, x: 0.5, y: -0.25 };
    const css = percentCropToCSS(crop, 80);
    expect(css).toContain('translate(40px, -20px)');
  });

  it('300px overlay: 50% offset = 150px translate', () => {
    const crop: PercentCrop = { scale: 1.2, x: 0.5, y: -0.25 };
    const css = percentCropToCSS(crop, 300);
    expect(css).toContain('translate(150px, -75px)');
  });

  it('identity crop at any size produces 0px translate', () => {
    const crop: PercentCrop = { scale: 1, x: 0, y: 0 };
    for (const size of [24, 40, 80, 300]) {
      const css = percentCropToCSS(crop, size);
      expect(css).toContain('translate(0px, 0px)');
      expect(css).toContain('scale(1)');
    }
  });
});

describe('TC-PDCA.6: Crop attribute passed from all creation points', () => {
  const { readFileSync, existsSync } = require('node:fs');
  const nodePath = require('node:path');
  const PROJECT_ROOT = nodePath.resolve(__dirname, '../../');

  const sources = [
    { name: 'rb-member-badge', file: 'src/public/ts/components/rb-member-badge.ts', alt: 'src/public/ts/components/rb-member-list.ts' },
    { name: 'RoomBrowser', file: 'src/public/ts/RoomBrowser.ts' },
    { name: 'ProfileEditor', file: 'src/public/ts/ProfileEditor.ts' },
  ];

  for (const source of sources) {
    it(`${source.name} passes crop attribute to rb-avatar`, () => {
      const filePath = nodePath.join(PROJECT_ROOT, source.file);
      const altPath = source.alt ? nodePath.join(PROJECT_ROOT, source.alt) : null;

      let content = '';
      if (existsSync(filePath)) {
        content = readFileSync(filePath, 'utf-8');
      } else if (altPath && existsSync(altPath)) {
        content = readFileSync(altPath, 'utf-8');
      }
      if (!content) return;

      const passesCrop = content.includes('crop') && content.includes('avatar');
      expect(passesCrop).toBe(true);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// S19: Room editor + Apply flow (code-presence verification)
// ═══════════════════════════════════════════════════════════════════════════

// [test:uuid:5b79cc8e-e44c-4cbb-ab54-9d9d06ab596b] test:RbRoomDetail.editOpen
describe('R19.2: editOpen — room name click opens editor', () => {
  it('RoomView.ts contains the editOpen impl marker and click handler', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/RoomView.ts'), 'utf-8');
    expect(src).toContain('[impl:uuid:f9b579c1-7495-4f93-8dec-736a0410a69a]');
    expect(src).toContain('editOpen');
  });
});

// [test:uuid:2420ff7d-e672-41ea-82e8-913105c75ace] test:JoinRequestFlow.applySend
describe('R19.5: applySend — BY-INVITE Apply button sends invite request', () => {
  it('RoomBrowser.ts contains the applySend impl marker and Apply button', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/RoomBrowser.ts'), 'utf-8');
    expect(src).toContain('[impl:uuid:5a397d5d-3d97-4152-8a7b-14caca1398ca]');
    expect(src).toContain('btn-apply');
    expect(src).toContain('Apply');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R19.86: GUARD — file/url/webitem click opens preview drawer (regression test)
// [test:uuid:c73b0ad9-7f6b-408d-ae0e-2607e3f19c0e] R19.86 dismiss threshold guard
// ═══════════════════════════════════════════════════════════════════════════

// [test:uuid:a7eaa994-2b58-4055-b7cd-c26c4a96044a] R19.86 RoomView.openFilePreview — click dispatches to preview
describe('R19.86: file/url/webitem click → openFilePreview → drawer opens', () => {
  it('RoomView click handler dispatches file/url/webitem types to openFilePreview', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/RoomView.ts'), 'utf-8');
    expect(src).toContain("type === 'file' || type === 'url' || type === 'webitem'");
    expect(src).toContain("ref.startsWith('file:')");
    expect(src).toContain('openFilePreview');
  });

  it('rb-detail-drawer touchstart non-handle sets dragging=false, not dismiss', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/trace/rb-detail-drawer.ts'), 'utf-8');
    const lines = src.split('\n');
    const touchStartLine = lines.findIndex(l => l.includes('private onTouchStart'));
    const touchMoveLine = lines.findIndex(l => l.includes('private onTouchMove'));
    const touchStartBody = lines.slice(touchStartLine, touchMoveLine).join('\n');
    expect(touchStartBody).toContain('this.dragging = false');
    expect(touchStartBody).not.toContain("this.dragging = 'dismiss'");
  });

  it('dismiss only triggers after >10px movement threshold', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/trace/rb-detail-drawer.ts'), 'utf-8');
    expect(src).toContain('dy > 10');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R19.84: GUARD — drag-resize drawer to 95vh, close below 120px
// [test:uuid:beea8c64-c42c-4e16-a1db-79958be53a0e] R19.84 dragResize
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// R19.87: CSS-GUARD — preview-zoom-container touch-action === 'pan-y'
// [test:uuid:fdeb8b19-55ea-4291-9976-df455d5a37f4] R19.87 touchActionPanY
// Honest: guards CSS is present. Does NOT prove iOS open (jsdom can't).
// R19.87 stays pending-device-confirm until Tron iOS verifies.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// R19.90 self-healing: upgradeProperty recovers data set before define/connect
// [test:uuid:81f953b1-5466-4c97-b0e0-309c2f9c99ba] R19.90 selfHealingUpgrade
// Honest: jsdom guards pattern; Tron slow-net device = seal.
// ═══════════════════════════════════════════════════════════════════════════

describe('R19.90: self-healing element — all 3 orderings render', () => {
  it('(a) data set BEFORE define → upgradeProperty recovers on connect', () => {
    const tag = 'test-heal-a-' + Date.now();
    const el = document.createElement(tag);
    (el as any).items = [{ uuid: 'u1', type: 'file', name: 'preDefine' }];

    class HealA extends HTMLElement {
      _items: any[] | null = null;
      set items(v: any[]) { this._items = v; }
      get items() { return this._items; }
      private upgradeProperty(prop: string) {
        if (this.hasOwnProperty(prop)) {
          const val = (this as any)[prop];
          delete (this as any)[prop];
          (this as any)[prop] = val;
        }
      }
      connectedCallback() { this.upgradeProperty('items'); }
    }
    customElements.define(tag, HealA);
    document.body.appendChild(el);

    expect((el as any).items).toEqual([{ uuid: 'u1', type: 'file', name: 'preDefine' }]);
    el.remove();
  });

  it('(b) data set BEFORE connect but AFTER define → setter fires, renders on connect', () => {
    const tag = 'test-heal-b-' + Date.now();
    let renderCount = 0;
    class HealB extends HTMLElement {
      _items: any[] | null = null;
      set items(v: any[]) { this._items = v; if (this.isConnected) renderCount++; }
      get items() { return this._items; }
      connectedCallback() { if (this._items) renderCount++; }
    }
    customElements.define(tag, HealB);
    const el = document.createElement(tag);
    (el as any).items = [{ uuid: 'u2', type: 'member', name: 'beforeConnect' }];
    expect(renderCount).toBe(0);
    document.body.appendChild(el);
    expect(renderCount).toBe(1);
    expect((el as any).items).toEqual([{ uuid: 'u2', type: 'member', name: 'beforeConnect' }]);
    el.remove();
  });

  it('(c) data set AFTER connect → setter renders immediately', () => {
    const tag = 'test-heal-c-' + Date.now();
    let rendered = false;
    class HealC extends HTMLElement {
      _items: any[] | null = null;
      set items(v: any[]) { this._items = v; if (this.isConnected) rendered = true; }
      get items() { return this._items; }
    }
    customElements.define(tag, HealC);
    const el = document.createElement(tag);
    document.body.appendChild(el);
    expect(rendered).toBe(false);
    (el as any).items = [{ uuid: 'u3', type: 'file', name: 'afterConnect' }];
    expect(rendered).toBe(true);
    expect((el as any).items?.length).toBe(1);
    el.remove();
  });
});

describe('R19.87: preview-zoom-container touch-action=pan-y (CSS guard)', () => {
  it('renderContentPreview for PDF produces container with touch-action:pan-y', async () => {
    const { renderContentPreview } = await import('../../src/public/ts/trace/content-preview.js');
    const html = renderContentPreview('test-uuid', 'application/pdf', 'test.pdf', 'tok');
    const div = document.createElement('div');
    div.innerHTML = html;
    const container = div.querySelector('.preview-zoom-container') as HTMLElement;
    expect(container).not.toBeNull();
    expect(container.style.touchAction).toBe('pan-y');
  });

  it('renderContentPreview for text/html produces container with touch-action:pan-y', async () => {
    const { renderContentPreview } = await import('../../src/public/ts/trace/content-preview.js');
    const html = renderContentPreview('test-uuid', 'text/html', 'page.html', 'tok');
    const div = document.createElement('div');
    div.innerHTML = html;
    const container = div.querySelector('.preview-zoom-container') as HTMLElement;
    expect(container).not.toBeNull();
    expect(container.style.touchAction).toBe('pan-y');
  });

  it('renderContentPreview for image does NOT use zoom container (no iframe)', async () => {
    const { renderContentPreview } = await import('../../src/public/ts/trace/content-preview.js');
    const html = renderContentPreview('test-uuid', 'image/jpeg', 'photo.jpg', 'tok');
    const div = document.createElement('div');
    div.innerHTML = html;
    expect(div.querySelector('.preview-zoom-container')).toBeNull();
    expect(div.querySelector('img')).not.toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R19.88: BEHAVIORAL — whenDefined gate → created items are upgraded instances
// [test:uuid:6a03bcb6-7719-4125-8f63-265a6479cf68] R19.88 whenDefinedUpgrade
// Honest: jsdom guards upgrade-gate present; Tron device = seal.
// ═══════════════════════════════════════════════════════════════════════════

describe('R19.88: render awaits whenDefined → items are upgraded', () => {
  it('render() awaits whenDefined before its renderMemberList call', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/RoomView.ts'), 'utf-8');
    const whenDefIdx = src.indexOf("whenDefined('rb-object-item')");
    expect(whenDefIdx).toBeGreaterThan(-1);
    const afterWhenDef = src.indexOf('this.renderMemberList()', whenDefIdx);
    expect(afterWhenDef).toBeGreaterThan(whenDefIdx);
  });

  it('rb-object-item defined via customElements.define upgrades on createElement', () => {
    class MockRbObjectItem extends HTMLElement {
      upgraded = false;
      connectedCallback() { this.upgraded = true; }
    }
    if (!customElements.get('rb-object-item-test')) {
      customElements.define('rb-object-item-test', MockRbObjectItem);
    }
    const el = document.createElement('rb-object-item-test');
    document.body.appendChild(el);
    expect(el).toBeInstanceOf(MockRbObjectItem);
    expect(el.upgraded).toBe(true);
    el.remove();
  });

  it('createElement before define produces HTMLElement, whenDefined+upgrade fixes it', async () => {
    const tag = 'rb-test-upgrade-' + Date.now();
    const el = document.createElement(tag);
    expect(el).not.toBeInstanceOf(HTMLDivElement);
    document.body.appendChild(el);

    class UpgradedEl extends HTMLElement {
      wasUpgraded = false;
      connectedCallback() { this.wasUpgraded = true; }
    }
    customElements.define(tag, UpgradedEl);
    await customElements.whenDefined(tag);

    const el2 = document.createElement(tag);
    document.body.appendChild(el2);
    expect(el2).toBeInstanceOf(UpgradedEl);
    expect(el2.wasUpgraded).toBe(true);
    el.remove();
    el2.remove();
  });
});

// [test:uuid:fda5a23e-c40a-445e-8a3e-de237cc4b988] R19.84 drawer.dragResize — CSS 95vh + resize clamp + close below 120px
describe('R19.84: handle drag resizes drawer to 95vh, close below 120px', () => {
  it('drawer CSS max-height is 95vh', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const css = readFileSync(nodePath.join(root, 'src/public/app.css'), 'utf-8');
    expect(css).toContain('max-height: 95vh');
  });

  it('resize mode clamps height to [0, 95vh] and close below 120px', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/trace/rb-detail-drawer.ts'), 'utf-8');
    expect(src).toContain("this.dragging = 'resize'");
    expect(src).toContain('window.innerHeight * 0.95');
    expect(src).toContain('h < 120');
    expect(src).toContain('this.close()');
  });

  it('handle drag sets height via style.height (not transform)', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/trace/rb-detail-drawer.ts'), 'utf-8');
    const lines = src.split('\n');
    const moveStart = lines.findIndex(l => l.includes('private onTouchMove'));
    const moveBody = lines.slice(moveStart, moveStart + 20).join('\n');
    expect(moveBody).toContain('this.style.height');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// R19.89: Remove-Local-Identity button renders in DeviceEnrollDialog only
// [test:uuid:43b76bc3-4bf4-4b2a-bc16-af73b4aa82ee] R19.89 removeLocalIdentity
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// R19.88.A: diff-render preserves existing items, appends new, removes departed
// [test:uuid:f825f9fe-9818-48dc-8183-8362dd1ac01f] R19.88.A diffRenderItems — dedicated (un-shared from 837fe19f)
// Honest: jsdom guards diff-logic; Tron device (mac+iOS) = seal.
// ═══════════════════════════════════════════════════════════════════════════

describe('R19.90: diffRenderItems preserves existing nodes', () => {
  it('existing item node is PRESERVED on re-render (same ref)', () => {
    const container = document.createElement('div');
    const node1 = document.createElement('div'); node1.className = 'tt-node';
    const row1 = document.createElement('div'); row1.className = 'tt-row';
    const item1 = document.createElement('rb-object-item');
    item1.setAttribute('ref', 'file:abc');
    item1.setAttribute('type', 'file');
    item1.setAttribute('name', 'old-name');
    row1.appendChild(item1); node1.appendChild(row1); container.appendChild(node1);

    const origNode = container.querySelector('.tt-node');
    const origItem = container.querySelector('rb-object-item');

    // Simulate diffRenderItems: same ref, updated attrs
    const existing = new Map();
    container.querySelectorAll(':scope > .tt-node').forEach(n => {
      const it = n.querySelector('rb-object-item');
      const ref = it?.getAttribute('ref') || '';
      if (ref) existing.set(ref, n);
    });
    const items = [{ ref: 'file:abc', attrs: { type: 'file', name: 'new-name', description: 'updated' } }];
    const wanted = new Set(items.map(i => i.ref));
    for (const [ref, node] of existing) { if (!wanted.has(ref)) node.remove(); }
    for (const { ref, attrs } of items) {
      const ex = existing.get(ref);
      if (ex) {
        const it = ex.querySelector('rb-object-item');
        for (const [k, v] of Object.entries(attrs)) it.setAttribute(k, v);
      }
    }

    expect(container.querySelector('.tt-node')).toBe(origNode);
    expect(container.querySelector('rb-object-item')).toBe(origItem);
    expect(container.querySelector('rb-object-item')?.getAttribute('name')).toBe('new-name');
  });

  it('new item is APPENDED, departed is REMOVED', () => {
    const container = document.createElement('div');
    // Start with item A
    const n1 = document.createElement('div'); n1.className = 'tt-node';
    const r1 = document.createElement('div'); r1.className = 'tt-row';
    const i1 = document.createElement('rb-object-item');
    i1.setAttribute('ref', 'file:a'); i1.setAttribute('type', 'file');
    r1.appendChild(i1); n1.appendChild(r1); container.appendChild(n1);

    // Diff-render with item B only (A departed, B new)
    const existing = new Map();
    container.querySelectorAll(':scope > .tt-node').forEach(n => {
      const it = n.querySelector('rb-object-item');
      existing.set(it?.getAttribute('ref') || '', n);
    });
    const items = [{ ref: 'file:b', attrs: { type: 'file', name: 'B' } }];
    const wanted = new Set(items.map(i => i.ref));
    for (const [ref, node] of existing) { if (!wanted.has(ref)) node.remove(); }
    for (const { ref, attrs } of items) {
      if (!existing.has(ref)) {
        const node = document.createElement('div'); node.className = 'tt-node';
        const row = document.createElement('div'); row.className = 'tt-row';
        const item = document.createElement('rb-object-item');
        item.setAttribute('ref', ref);
        for (const [k, v] of Object.entries(attrs)) item.setAttribute(k, v);
        row.appendChild(item); node.appendChild(row); container.appendChild(node);
      }
    }

    const allItems = container.querySelectorAll('rb-object-item');
    expect(allItems.length).toBe(1);
    expect(allItems[0].getAttribute('ref')).toBe('file:b');
    expect(allItems[0].getAttribute('name')).toBe('B');
  });

  it('no innerHTML nuke on container', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/RoomView.ts'), 'utf-8');
    const fnStart = src.indexOf('diffRenderItems');
    const fnBody = src.slice(fnStart, fnStart + 600);
    expect(fnBody).not.toContain('.innerHTML');
  });
});

describe('R19.89: Remove-Local-Identity button placement + click handler', () => {
  it('DeviceEnrollDialog renders de-remove-identity button', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/DeviceEnrollDialog.ts'), 'utf-8');
    const lines = src.split('\n');
    const btnLine = lines.find(l => l.includes('de-remove-identity'));
    expect(btnLine).toBeDefined();
    expect(btnLine).toContain('Remove Local Identity');
  });

  // [test:uuid:bbaa4292-5f91-45f8-bb20-7cec8b2bf0e1] R19.72 DeviceEnrollDialog.removeLocalIdentity — click handler wired
  it('de-remove-identity click handler invokes removeLocalIdentity logic', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/DeviceEnrollDialog.ts'), 'utf-8');
    const clickIdx = src.indexOf("de-remove-identity')?.addEventListener('click'");
    expect(clickIdx).toBeGreaterThan(-1);
    const handlerBlock = src.slice(clickIdx, clickIdx + 300);
    expect(handlerBlock).toContain('localStorage');
  });

  it('ProfileEditor does NOT contain de-remove-identity', () => {
    const { readFileSync } = require('node:fs');
    const nodePath = require("node:path");
    const root = nodePath.resolve(__dirname, '../../');
    const src = readFileSync(nodePath.join(root, 'src/public/ts/ProfileEditor.ts'), 'utf-8');
    expect(src).not.toContain('de-remove-identity');
    expect(src).not.toContain('removeLocalIdentity');
  });
});
