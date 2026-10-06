import { expect, test } from '@playwright/test';

test.describe('C1RCLE Partner Dashboard', () => {
  test('renders useful landing content without waiting for the cinematic scene', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', { level: 1, name: 'Command Your Nightlife Empire' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Already a User' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Apply for Partner Access/ })).toBeVisible();
  });

  test('puts the returning-user action first in keyboard order', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    await expect(page.getByRole('link', { name: 'Already a User' })).toBeFocused();
  });

  test('exposes every partner role on the login route', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /Venue/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Host/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Promoter/ })).toBeVisible();
  });
});
