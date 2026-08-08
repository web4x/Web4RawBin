/**
 * R40.3 — terminal keyboard controller (chain 9bbfd7437). A data-driven bottom-bar of keys whose rows come from a
 * config UNIT (keymap c16abc17) — the FULL controller (arrows/Ctrl/Esc/Tab/macros) is a later config EDIT, no rewrite.
 * Each key sends its byte SEQUENCE to the terminal via the SAME R31.4 ws PTY. Pairs with OS-keyboard suppression so a
 * pane stays fully interactive WITHOUT the iOS soft keyboard.
 * ⚠ suppressSoftKeyboard is DEVICE-GATED: real-WebKit @390 (Tron) is the only authority that the OSK does not appear;
 *   this code CANNOT prove that headlessly (desktop WebKit has no OSK — a vacuous pass). What IS automatable + proven
 *   here: focus is kept, and synthetic keys STILL reach the PTY (suppression that broke typing would not be a fix).
 */
export interface KeyDef { label: string; sequence?: string; modifier?: string; width?: number; }

// JSON stores sequences escaped ("\\u001b"); turn them into real control bytes before sending to the PTY.
function unescapeSeq(s: string): string {
  return String(s || '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_m, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\\e/g, '\x1b').replace(/\\t/g, '\t').replace(/\\r/g, '\r').replace(/\\n/g, '\n');
}

export class RbKeyboardBar {
  // [impl:uuid:c3a56e56-2f91-452f-9b1d-c267802687e1] RbKeyboardBar.suppressSoftKeyboard — configure the terminal focus
  // target so the OS soft keyboard does NOT open, WITHOUT losing focus/interactivity (keystrokes arrive from this
  // controller + any hardware keyboard, not the OSK). Primary: inputmode=none; belt: readonly. DEVICE-GATED on real iOS.
  static suppressSoftKeyboard(el: HTMLElement | null): void {
    if (!el) return;
    el.setAttribute('inputmode', 'none');           // modern WebKit keeps focus but does not raise the OSK
    el.setAttribute('autocapitalize', 'off');
    el.setAttribute('autocorrect', 'off');
    el.setAttribute('spellcheck', 'false');
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) el.setAttribute('readonly', 'readonly'); // fallback: OS won't offer to type into a readonly field; controller writes straight to the PTY
  }

  // [impl:uuid:dbdcc42d-868b-4679-a039-1f4d0d8bfbdf] RbKeyboardBar.renderKeyMap — build the key-bar from the keymap
  // config unit (data-driven, not hardcoded); each key tap sends its UNESCAPED byte sequence to the terminal via the
  // supplied `send` (the R31.4 ws PTY). Ctrl-style modifiers arm the next key (send Ctrl+<letter> = byte 1..26).
  static renderKeyMap(keys: KeyDef[], send: (bytes: string) => void): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'rb-keybar';
    bar.style.cssText = 'flex:0 0 auto;display:flex;flex-wrap:wrap;gap:4px;padding:6px 4px;background:#161b22;border-top:1px solid #30363d';
    let ctrlArmed = false;
    for (const k of keys) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = k.label;
      btn.style.cssText = `flex:0 0 auto;min-width:${(k.width || 1) * 34}px;height:34px;background:#21262d;color:#e6edf3;border:1px solid #30363d;border-radius:5px;font:600 0.85rem monospace;cursor:pointer`;
      btn.addEventListener('click', () => {
        if (k.modifier === 'ctrl') { ctrlArmed = !ctrlArmed; btn.style.background = ctrlArmed ? '#238636' : '#21262d'; return; }
        let seq = unescapeSeq(k.sequence || '');
        if (ctrlArmed && seq.length === 1) { const c = seq.toUpperCase().charCodeAt(0); if (c >= 64 && c <= 95) seq = String.fromCharCode(c - 64); ctrlArmed = false; } // Ctrl+A..Z → 1..26
        if (seq) send(seq);
      });
      bar.appendChild(btn);
    }
    return bar;
  }
}
