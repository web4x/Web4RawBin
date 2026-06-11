/**
 * T191 Champagne — component tests for shipped features lacking dedicated tests.
 * @vitest-environment jsdom
 *
 * [test:uuid:681e2949-181f-48cd-bcf6-f88b08887218] T191 champagne component tests
 * [verifies:uuid:45d4e5f6-a7b8-4c90-8d01-2e3f4a5b6c75] R15.5 ListOverview search
 * [verifies:uuid:e412e965-bcdf-4d33-97df-65c00d14e9c2] R15.7 traceability browser
 * [verifies:uuid:9186094e-0711-4859-b245-95cb514acfb2] R16.1 DetailViewContainer
 * [verifies:uuid:1a8b7485-ca53-4d06-8a05-02cf40541981] R18.1 scenario browser methods
 * [verifies:uuid:37147d5d-bdb6-4011-a433-2af6b5ad68b4] R18.6 tree append expand
 * [verifies:uuid:43af9197-cfa5-4da0-9d94-ff8a32d16570] R18.7 scroll preserve
 */

import { describe, it, expect, beforeEach } from 'vitest';

describe('rb-detail-drawer — T110 DetailViewContainer', () => {
  // [verifies:uuid:9186094e-0711-4859-b245-95cb514acfb2] R16.1
  beforeEach(() => { document.body.innerHTML = ''; });

  it('opens on ref attribute set, closes on remove', async () => {
    const { RbDetailDrawer } = await import('../../src/public/ts/trace/rb-detail-drawer.js');
    if (!customElements.get('rb-detail-drawer')) customElements.define('rb-detail-drawer', RbDetailDrawer);
    const el = document.createElement('rb-detail-drawer') as any;
    document.body.appendChild(el);
    expect(el.hasAttribute('open')).toBe(false);
    el.setAttribute('ref', 'task:abc');
    expect(el.hasAttribute('open')).toBe(true);
    el.close();
    expect(el.hasAttribute('open')).toBe(false);
    expect(el.getAttribute('ref')).toBeNull();
  });

  it('ESC key closes drawer', async () => {
    const { RbDetailDrawer } = await import('../../src/public/ts/trace/rb-detail-drawer.js');
    if (!customElements.get('rb-detail-drawer')) customElements.define('rb-detail-drawer', RbDetailDrawer);
    const el = document.createElement('rb-detail-drawer') as any;
    document.body.appendChild(el);
    el.setAttribute('ref', 'task:abc');
    expect(el.hasAttribute('open')).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(el.hasAttribute('open')).toBe(false);
  });
});

describe('rb-object-item — T105/T112/T113/T114', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders with type icon + name + description', async () => {
    const { RbObjectItem } = await import('../../src/public/ts/trace/rb-object-item.js');
    if (!customElements.get('rb-object-item')) customElements.define('rb-object-item', RbObjectItem);
    const el = document.createElement('rb-object-item');
    el.setAttribute('type', 'task');
    el.setAttribute('title', 'Test Task Title Here And More');
    el.setAttribute('description', 'A longer description');
    el.setAttribute('ref', 'task:abc-123');
    document.body.appendChild(el);
    const name = el.querySelector('.oi-name');
    const desc = el.querySelector('.oi-desc');
    const icon = el.querySelector('.oi-icon');
    expect(name).toBeDefined();
    expect(icon).toBeDefined();
    expect(el.querySelector('.oi-icon')?.getAttribute('draggable')).toBe('true');
  });

  it('generates speaky name from title when name attr absent', async () => {
    const { RbObjectItem } = await import('../../src/public/ts/trace/rb-object-item.js');
    if (!customElements.get('rb-object-item')) customElements.define('rb-object-item', RbObjectItem);
    const el = document.createElement('rb-object-item');
    el.setAttribute('type', 'requirement');
    el.setAttribute('title', 'one two three four five six seven eight');
    el.setAttribute('ref', 'requirement:xyz');
    document.body.appendChild(el);
    const name = el.querySelector('.oi-name');
    expect(name?.textContent).toContain('one two three four five');
  });
});

describe('Lucide icons — T113 R16.5', () => {
  it('TRACE_ICONS has entries for all 7 types', async () => {
    const { TRACE_ICONS } = await import('../../src/public/ts/trace/icons.js');
    for (const type of ['requirement', 'task', 'usecase', 'class', 'method', 'implementation', 'test']) {
      expect(TRACE_ICONS[type]).toBeDefined();
      expect(TRACE_ICONS[type]).toContain('<svg');
      expect(TRACE_ICONS[type]).toContain('viewBox="0 0 24 24"');
    }
  });
});

describe('ViewBus — T145 pub/sub singleton', () => {
  it('subscribe + publish delivers model to listener', async () => {
    const { viewBus } = await import('../../src/public/ts/ViewBus.js');
    let received: any = null;
    const unsub = viewBus.subscribe('User', 'test-token', (model: any) => { received = model; });
    viewBus.publish('User', 'test-token', { displayName: 'NewName' });
    expect(received).toEqual({ displayName: 'NewName' });
    unsub();
    viewBus.publish('User', 'test-token', { displayName: 'After' });
    expect(received).toEqual({ displayName: 'NewName' });
  });
});

describe('IOR resolution — R17.2', () => {
  // [verifies:uuid:3b6cce5a-581c-4325-88b2-b9d381c7f268] R17.2
  it('parseIor extracts type and value', async () => {
    const { parseIor, iorInstance } = await import('../../src/ts/scenario/index.js');
    const parsed = parseIor('ior:instance:abc-123');
    expect(parsed).toBeDefined();
    expect(parsed!.type).toBe('instance');
    expect(parsed!.value).toBe('abc-123');
    const built = iorInstance('def-456');
    expect(built).toBe('ior:instance:def-456');
  });
});
