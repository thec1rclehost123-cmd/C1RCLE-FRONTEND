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

  test('labels the sign-in form fields for assistive technology', async ({ page }) => {
    // The console is auth-gated: with no session the shell redirects every
    // route (except /login) to /login, so the primary navigation landmark
    // only exists after authentication and cannot be asserted unauthenticated.
    // Its accessible name is covered by the AppShell component test instead;
    // this spec asserts the reachable pre-auth surface.
    await page.goto('/login');

    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  for (const path of ['/onboarding', '/kyc-review']) {
    test(`gates the ${path} review desk behind sign-in`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Onboarding|KYC review/ })).toHaveCount(0);
    });
  }
});
