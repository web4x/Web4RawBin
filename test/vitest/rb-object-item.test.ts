/**
 * T105 — rb-object-item defaultItemView tests (AC7).
 * render-per-type, draggable + 3 dataTransfer payloads, ViewBus live re-render, click→navigate.
 *
 * @vitest-environment jsdom
 * [test:uuid:105f5061-7283-4495-8a6c-f05050505106] R15.4
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RbObjectItem } from '../../src/public/ts/trace/rb-object-item.js';
import { ViewBus } from '../../src/public/ts/trace/ViewBus.js';
import { setActiveRouter } from '../../src/public/ts/trace/nav.js';

const UUID = '15a1b2c3-d4e5-4f60-8a71-9b0c1d2e3f01';
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

  // AC1: renders for all 7 types
  it('renders title + type:uuid sub-line (+ status) for all 7 types (AC1)', () => {
    for (const type of TYPES) {
      const el = mk(type, 'My ' + type, 'DONE');
      expect(el.querySelector('.item-title')!.textContent).toBe('My ' + type);
      expect(el.querySelector('.item-id')!.textContent).toBe(`${type}:${UUID}`);
      expect(el.querySelector('.item-status')!.textContent).toBe('DONE');
      el.remove();
    }
  });

  // AC2: room-card idiom
  it('uses the .object-item card idiom (AC2)', () => {
    const el = mk('task');
    expect(el.classList.contains('object-item')).toBe(true);
    expect(el.querySelector('.item-info')).toBeTruthy();
  });

  // AC3/AC4: draggable + 3 dataTransfer payloads
  it('is draggable and sets all three dataTransfer payloads (AC3/AC4)', () => {
    const el = mk('task');
    expect(el.getAttribute('draggable')).toBe('true');
    const store: Record<string, string> = {};
    const dt = { setData: (k: string, v: string) => { store[k] = v; }, effectAllowed: '' } as unknown as DataTransfer;
    el.dispatchEvent(Object.assign(new Event('dragstart'), { dataTransfer: dt }));
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
    expect(el.querySelector('.item-title')!.textContent).toBe('after-model-change');
    el.remove();
    expect(ViewBus.count(`task:${UUID}`)).toBe(0); // unsubscribed on disconnect
  });

  // AC6: click → navigate(type,'show',{uuid})
  it('click calls navigate(type, show, {uuid}) via the active router (AC6)', () => {
    const navSpy = vi.fn();
    setActiveRouter({ navigate: navSpy });
    const el = mk('requirement');
    el.dispatchEvent(new Event('click'));
    expect(navSpy).toHaveBeenCalledWith('requirement', 'show', { uuid: UUID });
  });
});
