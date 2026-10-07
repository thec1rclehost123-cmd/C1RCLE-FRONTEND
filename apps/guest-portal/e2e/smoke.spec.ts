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

  for (const path of ['/profile', '/tickets']) {
    test(`redirects the private ${path} route to login with a clean return path`, async ({
      page,
    }) => {
      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}$`));
    });
  }

  test('serves a real email and password sign-in form anonymously', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toHaveAttribute(
      'href',
      '/forgot-password',
    );
  });

  test('keeps /forgot-password reachable without a session', async ({ page }) => {
    await page.goto('/forgot-password');

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible();
  });

  test('keeps /reset-password reachable and asks for a new link when the token is missing', async ({
    page,
  }) => {
    await page.goto('/reset-password');

    await expect(page).toHaveURL(/\/reset-password$/);
    await expect(page.getByRole('link', { name: 'Request a new link' })).toBeVisible();
  });

  test('strips the reset token from the address bar', async ({ page }) => {
    await page.goto('/reset-password?token=abc123');

    await expect(page.getByLabel('New password')).toBeVisible();
    await expect(page).toHaveURL(/\/reset-password$/);
  });
});
