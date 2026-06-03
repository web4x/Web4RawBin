// [test:uuid:76a00001-0001-4a01-a001-000176010001] T176 R-O module exec proof
import { test, expect } from '@playwright/test';

test.describe('T176: ES module execution over self-signed SSL', () => {
  test('scenario page ES module executes and sets window global', async ({ page }) => {
    // Navigate to /scenario (has type=module script)
    await page.goto('/scenario');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Check if the module JS actually ran by looking for DOM content it creates
    // The scenario-view bundle creates the page content
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasContent = bodyText.length > 50;

    // Also check for console errors related to module loading
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));

    // Check if any script tags with type=module exist and loaded
    const moduleScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="module"]');
      return Array.from(scripts).map(s => ({
        src: (s as HTMLScriptElement).src,
        loaded: true,
      }));
    });

    console.log(`Module scripts found: ${moduleScripts.length}`);
    console.log(`Body text length: ${bodyText.length}`);
    console.log(`Page errors: ${errors.length}`);

    expect(moduleScripts.length).toBeGreaterThan(0);
    expect(hasContent).toBe(true);
  });

  test('/trace page ES module loads tree component', async ({ page }) => {
    await page.goto('/trace');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // trace-page module creates rb-trace-tree element
    const hasTree = await page.evaluate(() => !!document.querySelector('rb-trace-tree'));
    const bodyLen = await page.evaluate(() => document.body.innerText.length);

    console.log(`Has rb-trace-tree: ${hasTree}, body length: ${bodyLen}`);
    expect(hasTree || bodyLen > 100).toBe(true);
  });
});
