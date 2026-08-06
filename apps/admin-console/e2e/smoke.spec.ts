import { expect, test } from '@playwright/test';

test.describe('C1RCLE Admin Console', () => {
  test('renders its landing page', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: 'C1RCLE Admin Console' }),
    ).toBeVisible();
  });

  test('exposes a keyboard skip link as the first stop', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });

  test('primary navigation is labelled for assistive technology', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });
});
