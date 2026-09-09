import { expect, test } from '@playwright/test';

test.describe('C1RCLE Guest Portal', () => {
  test('renders its landing page', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: 'THE C1RCLE' })).toBeVisible();
  });

  test('exposes a keyboard skip link as the first stop', async ({ page }) => {
    await page.goto('/');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });

    // Mobile WebKit emulates a touch-only iPhone, where Tab navigation is not
    // available. Verify that the target is focusable there and preserve the
    // first-tab assertion in the desktop keyboard project.
    if (test.info().project.name === 'mobile-safari') {
      await skipLink.focus();
      await expect(skipLink).toBeFocused();
      return;
    }

    await page.keyboard.press('Tab');

    await expect(skipLink).toBeFocused();
  });

  test('primary navigation is labelled for assistive technology', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
  });
});
