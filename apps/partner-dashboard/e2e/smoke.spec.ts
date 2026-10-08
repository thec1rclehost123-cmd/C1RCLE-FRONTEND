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
    const returningUserLink = page.getByRole('link', { name: 'Already a User' });
    // Wait for the auth gate to resolve so the first Tab starts from the real
    // landing DOM — otherwise Tab fires while nothing is focusable and focus
    // stays stuck on <body>.
    await expect(returningUserLink).toBeVisible();
    await page.keyboard.press('Tab');

    await expect(returningUserLink).toBeFocused();
  });

  test('exposes every partner role on the login route', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('button', { name: /Venue/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Host/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Promoter/ })).toBeVisible();
  });

  test('sends an unauthenticated /venue visit to /login with the return path', async ({ page }) => {
    await page.goto('/venue/events');

    await expect(page).toHaveURL(/\/login\?next=%2Fvenue%2Fevents$/);
    await expect(page.getByRole('button', { name: /Venue/ })).toBeVisible();
  });

  test('keeps the public onboarding wizard reachable without a session', async ({ page }) => {
    await page.goto('/onboard');

    await expect(page).toHaveURL(/\/onboard/);
  });

  test('sets a nonce-based CSP with a single frame-src directive', async ({ request }) => {
    const response = await request.get('/login');
    const csp = response.headers()['content-security-policy'] ?? '';

    expect(csp).toMatch(/script-src [^;]*'nonce-/);
    expect(csp.match(/frame-src/g)).toHaveLength(1);
  });
});
