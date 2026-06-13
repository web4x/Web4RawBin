/**
 * T105 — rb-object-item defaultItemView tests (AC7).
 * render-per-type, draggable + 3 dataTransfer payloads, ViewBus live re-render, click→navigate.
 *
 * @vitest-environment jsdom
 * [test:uuid:47528657-dbd5-48f1-b7cf-cd2bffb53967] R15.4
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RbObjectItem } from '../../src/public/ts/trace/rb-object-item.js';
import { ViewBus } from '../../src/public/ts/trace/ViewBus.js';
import { setActiveRouter } from '../../src/public/ts/trace/nav.js';

// Under vitest-jsdom the component module is evaluated before jsdom attaches
// `customElements`, so its top-level self-register guard (`typeof customElements
// !== 'undefined'`) is skipped. In a real browser customElements always exists, so
// the component registers fine. Replicate that here: ensure registration before use.
if (!customElements.get('rb-object-item')) customElements.define('rb-object-item', RbObjectItem);

const UUID = '05284ac5-131a-4e10-a2f7-7215e026e438';
const TYPES = ['requirement', 'task', 'usecase', 'class', 'method', 'implementation', 'test'];

function mk(type: string, title = 'T', status = ''): RbObjectItem {
  const el = document.createElement('rb-object-item') as RbObjectItem;
  el.setAttribute('ref', `${type}:${UUID}`);
  el.setAttribute('type', type);
  el.setAttribute('title', title);
  if (status) el.setAttribute('status', status);
  document.body.appendChild(el);
  return el;
}

describe('T105 rb-object-item', () => {
  afterEach(() => { document.body.innerHTML = ''; setActiveRouter(null); });

  // AC1: renders name + description for all 7 types (T112 two-line layout)
  it('renders name + description for all 7 types (AC1)', () => {
    for (const type of TYPES) {
      const el = mk(type, 'My ' + type, 'DONE');
      expect(el.querySelector('.oi-name')!.textContent).toBe('My ' + type);
      expect(el.querySelector('.oi-desc')!.textContent).toBe('My ' + type);
      el.remove();
    }
  });

  // AC2: object-item card with oi-content layout (T112)
  it('uses the .object-item card idiom (AC2)', () => {
    const el = mk('task');
    expect(el.classList.contains('object-item')).toBe(true);
    expect(el.querySelector('.oi-content')).toBeTruthy();
  });

  // AC3/AC4: draggable on icon + 3 dataTransfer payloads
  it('is draggable and sets all three dataTransfer payloads (AC3/AC4)', () => {
    const el = mk('task');
    const icon = el.querySelector('.oi-icon')!;
    expect(icon.getAttribute('draggable')).toBe('true');
    const store: Record<string, string> = {};
    const dt = { setData: (k: string, v: string) => { store[k] = v; }, effectAllowed: '' } as unknown as DataTransfer;
    icon.dispatchEvent(Object.assign(new Event('dragstart', { bubbles: true }), { dataTransfer: dt }));
    expect(store['text/plain']).toBe(`#task.show?uuid=${UUID}`);
    expect(store['text/uri-list'].endsWith(`/app#task.show?uuid=${UUID}`)).toBe(true);
    expect(store['application/rb-object-ref']).toBe(`task:${UUID}`);
    expect((dt as any).effectAllowed).toBe('copyLink');
  });

  // AC5: ViewBus live re-render
  it('re-renders on ViewBus.notify(ref) — no reload (AC5)', () => {
    const el = mk('task', 'before');
    expect(ViewBus.count(`task:${UUID}`)).toBe(1);
    el.setAttribute('title', 'after-model-change');
    ViewBus.notify(`task:${UUID}`);
    expect(el.querySelector('.oi-name')!.textContent).toBe('after-model-change');
    el.remove();
    expect(ViewBus.count(`task:${UUID}`)).toBe(0); // unsubscribed on disconnect
  });

  // AC6: click → selects item (R20.6 selection model)
  it('click selects the item via selection model (AC6)', () => {
    const el = mk('requirement');
    el.dispatchEvent(new Event('click'));
    expect(el.hasAttribute('selected')).toBe(true);
  });
});
