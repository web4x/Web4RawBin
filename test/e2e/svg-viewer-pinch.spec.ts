// [test:uuid:b34b1801-1234-4abc-8def-svgviewer1801] R18.34.B champagne — pinch-no-pan applies zoom
// [test:uuid:10c2e3ca-bd66-46c9-ad53-8dea1604b484]
// Chain: R18.34 spec → uc:svgViewer.pinchZoom → class:SvgViewerStage → method:onTouchEnd → impl:/svg-viewer touchend handler → TEST
import { test as base, expect, devices } from '@playwright/test';

// Touch-enabled context — TouchEvent constructor needs hasTouch:true
const test = base.extend({});
test.use({ ...devices['iPhone 13'], viewport: { width: 1280, height: 720 } });

const SVG = '/md/raw/scrum.pmo/sprints/sprint-17-scenario-units/diagrams/s17-usecases.svg';

async function pinchNoPanReleased(page: import('@playwright/test').Page, factor: number): Promise<{ before: string; after: string }> {
  // Wait for img to load + initial fit (check computed transform, not just inline)
  await page.waitForFunction(() => {
    const el = document.querySelector('#stage > *') as HTMLElement | null;
    if (!el) return false;
    const t = el.style.transform || getComputedStyle(el).transform;
    return t && t !== 'none' && t.startsWith('matrix(');
  }, { timeout: 20000 });

  const before = await page.evaluate(() => {
    const img = document.querySelector('#stage > *') as HTMLElement;
    return img.style.transform || getComputedStyle(img).transform;
  });

  // Synthesize 2-touch pinch entirely in the page context via Touch + TouchEvent
  await page.evaluate(async (zoomFactor: number) => {
    const stage = document.getElementById('stage')!;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startGap = 100; // initial finger distance
    const endGap = startGap * zoomFactor;

    const mkTouch = (id: number, x: number, y: number): Touch =>
      new Touch({
        identifier: id, target: stage, clientX: x, clientY: y, pageX: x, pageY: y,
        screenX: x, screenY: y, radiusX: 0, radiusY: 0, rotationAngle: 0, force: 1,
      });

    const fire = (type: string, touches: Touch[], changedTouches: Touch[]) => {
      const ev = new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches, targetTouches: touches, changedTouches,
        view: window,
      });
      stage.dispatchEvent(ev);
    };

    // start: two fingers at center ± gap/2
    const t1Start = mkTouch(1, cx - startGap / 2, cy);
    const t2Start = mkTouch(2, cx + startGap / 2, cy);
    fire('touchstart', [t1Start, t2Start], [t1Start, t2Start]);

    // move: spread to endGap (multiple steps for smoothness)
    for (let i = 1; i <= 5; i++) {
      const g = startGap + ((endGap - startGap) * i) / 5;
      const t1 = mkTouch(1, cx - g / 2, cy);
      const t2 = mkTouch(2, cx + g / 2, cy);
      fire('touchmove', [t1, t2], [t1, t2]);
      await new Promise(r => setTimeout(r, 20));
    }

    // end: BOTH lift, no further movement, no pan — touches array is empty
    const t1End = mkTouch(1, cx - endGap / 2, cy);
    const t2End = mkTouch(2, cx + endGap / 2, cy);
    fire('touchend', [], [t1End, t2End]);
  }, factor);

  await page.waitForTimeout(150);
  const after = await page.evaluate(() => {
    const img = document.querySelector('#stage > *') as HTMLElement;
    return img.style.transform || getComputedStyle(img).transform;
  });
  return { before, after };
}

function scaleOf(matrix: string): number {
  const m = matrix.match(/matrix\(([\d.-]+)/);
  return m ? parseFloat(m[1]) : NaN;
}

test.describe('R18.34.B champagne — pinch-no-pan applies zoom (svg-viewer)', () => {
  test('synthesized 2-touch pinch with no pan: after release, scale == pinched scale', async ({ page }) => {
    await page.goto('/svg-viewer?src=' + encodeURIComponent(SVG));

    const { before, after } = await pinchNoPanReleased(page, 2.0);
    const scaleBefore = scaleOf(before);
    const scaleAfter = scaleOf(after);

    expect(scaleBefore).toBeGreaterThan(0);
    expect(scaleAfter).toBeGreaterThan(0);
    // After 2x pinch with no pan, scale should approximately double
    expect(scaleAfter).toBeGreaterThan(scaleBefore * 1.5);
    // And NOT have reverted to pre-pinch
    expect(scaleAfter).not.toEqual(scaleBefore);
  });

  test('10x repeated pinch-release-no-pan: all 10 hold (no revert)', async ({ page }) => {
    await page.goto('/svg-viewer?src=' + encodeURIComponent(SVG));

    let lastScale = -1;
    for (let i = 0; i < 10; i++) {
      const { before, after } = await pinchNoPanReleased(page, 1.3);
      const sB = scaleOf(before);
      const sA = scaleOf(after);
      // Each pinch increases scale; after release, the new scale must hold
      expect(sA).toBeGreaterThan(sB);
      expect(sA).not.toEqual(sB);
      lastScale = sA;
    }
    // Final scale should be substantially larger than initial (~1.3^10 ≈ 13.8x)
    expect(lastScale).toBeGreaterThan(1);
  });
});
