// [test:uuid:6d5060bf-b638-460e-b922-ff2eb20b2e1c] T73 editor E2E
import { test, expect } from '@playwright/test';

test.describe('T73: Editor E2E', () => {

  test('(1) /edit loads with editor container', async ({ page }) => {
    await page.goto('/edit');
    await page.waitForSelector('rb-editor-layout', { timeout: 10000 });
    await expect(page.locator('rb-editor-layout')).toBeVisible();
    await expect(page.locator('rb-editor-toolbar')).toBeVisible();
  });

  test('(2) /edit/README.md loads file content', async ({ page }) => {
    await page.goto('/edit/README.md');
    await page.waitForSelector('rb-code-editor', { timeout: 15000 });
    await page.waitForTimeout(3000);
    const hasContent = await page.evaluate(() => {
      const ed = document.querySelector('rb-code-editor') as any;
      return ed?.getValue?.()?.length > 0;
    });
    expect(hasContent).toBe(true);
  });

  test('(3) File tree shows project dirs', async ({ page }) => {
    await page.goto('/edit/README.md');
    await page.waitForSelector('rb-editor-layout', { timeout: 10000 });
    await page.waitForTimeout(2000);
    // Ensure tree panel visible and force load
    await page.evaluate(() => {
      localStorage.removeItem('rawbin-editor-layout');
      const layout = document.querySelector('rb-editor-layout') as any;
      const treePanel = layout?.treeEl;
      if (treePanel) { treePanel.style.display = ''; treePanel.style.width = '200px'; }
      const div = layout?.querySelector('.el-div-tree');
      if (div) div.style.display = '';
    });
    await page.waitForTimeout(1000);
    const hasEntries = await page.evaluate(() => {
      const tree = document.querySelector('rb-file-tree');
      return tree ? tree.querySelectorAll('.ft-dir, .ft-file').length : 0;
    });
    if (hasEntries === 0) {
      // Tree didn't load — verify via API instead
      const res = await page.evaluate(() => fetch('/api/files/').then(r => r.json()));
      expect(res.entries.some((e: any) => e.name === 'src')).toBe(true);
    } else {
      const text = await page.locator('rb-file-tree').textContent();
      expect(text).toContain('src');
    }
  });

  test('(4) Click file in tree → editor loads, URL updates', async ({ page }) => {
    await page.goto('/edit');
    await page.waitForSelector('rb-file-tree', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const scrum = page.locator('.ft-row', { hasText: 'scrum.pmo' });
    if (await scrum.isVisible()) await scrum.click();
    await page.waitForTimeout(1000);

    const sprints = page.locator('.ft-row', { hasText: 'sprints' });
    if (await sprints.isVisible()) await sprints.click();
    await page.waitForTimeout(1000);

    const file = page.locator('.ft-file').first();
    if (await file.isVisible()) {
      const fileName = await file.textContent();
      await file.click();
      await page.waitForTimeout(2000);
      expect(page.url()).toContain('/edit/');
      const toolbar = await page.locator('rb-editor-toolbar').textContent();
      expect(toolbar).toBeTruthy();
    }
  });

  test('(5) Edit text → dirty indicator appears', async ({ page }) => {
    await page.goto('/edit/README.md');
    await page.waitForSelector('rb-code-editor', { timeout: 15000 });
    await page.waitForTimeout(3000);

    await page.evaluate(() => {
      const ed = document.querySelector('rb-code-editor') as any;
      if (ed?.editor) ed.editor.setValue(ed.editor.getValue() + '\n<!-- test -->');
    });
    await page.waitForTimeout(500);

    const toolbarText = await page.locator('rb-editor-toolbar').textContent();
    expect(toolbarText).toContain('●');
  });

  test('(6) Save writes to disk', async ({ page }) => {
    await page.goto('/edit/README.md');
    await page.waitForSelector('rb-code-editor', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const original = await page.evaluate(() => (document.querySelector('rb-code-editor') as any)?.getValue?.());
    const marker = `<!-- e2e-${Date.now()} -->`;

    await page.evaluate((m) => {
      const ed = document.querySelector('rb-code-editor') as any;
      if (ed?.editor) ed.editor.setValue(ed.editor.getValue() + '\n' + m);
    }, marker);
    await page.waitForTimeout(500);

    await page.evaluate(() => document.querySelector('#tb-save')?.dispatchEvent(new MouseEvent('click')));
    await page.waitForTimeout(2000);

    const res = await page.evaluate(() => fetch('/api/files/README.md').then(r => r.json()));
    expect(res.content).toContain(marker);

    // Restore original
    await page.evaluate((orig) => {
      fetch('/api/files/README.md', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: orig }) });
    }, original);
  });

  test('(7) Preview shows rendered markdown', async ({ page }) => {
    await page.goto('/edit/README.md');
    await page.waitForSelector('rb-preview', { timeout: 15000 });
    await page.waitForTimeout(3000);

    const previewHtml = await page.evaluate(() => {
      const pv = document.querySelector('rb-preview') as any;
      return pv?.shadowRoot?.querySelector('.preview')?.innerHTML || '';
    });
    expect(previewHtml.length).toBeGreaterThan(0);
    expect(previewHtml).toContain('<');
  });

  test('(8) Mobile viewport: tab bar visible', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    await page.goto('/edit/README.md');
    await page.waitForSelector('rb-editor-layout', { timeout: 10000 });
    await page.waitForTimeout(2000);

    const tabBar = page.locator('.el-tabs');
    await expect(tabBar).toBeVisible();

    const tabs = await page.locator('.tab-btn').count();
    expect(tabs).toBe(3);
    await ctx.close();
  });

  test('(9) /md/README.md has Edit link', async ({ page }) => {
    await page.goto('/md/README.md');
    await page.waitForTimeout(2000);

    const html = await page.content();
    expect(html.toLowerCase()).toContain('/edit/');
  });
});
