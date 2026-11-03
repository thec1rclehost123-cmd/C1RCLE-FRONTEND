import { expect, test } from '@playwright/test';

const viewports = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'small tablet', width: 768, height: 1024 },
  { name: 'standard laptop', width: 1440, height: 900 },
  { name: 'wide desktop', width: 1920, height: 1080 },
] as const;

for (const viewport of viewports) {
  test(`home fits the ${viewport.name} viewport`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { level: 1, name: 'THE C1RCLE' })).toBeVisible({
      timeout: 60_000,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
