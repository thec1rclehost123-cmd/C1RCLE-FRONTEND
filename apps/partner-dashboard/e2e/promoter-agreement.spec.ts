import { expect, test } from '@playwright/test';

test('reviews and explicitly accepts a staging-only agreement on desktop and phone', async ({
  page,
}, testInfo) => {
  if (testInfo.project.name === 'mobile-chromium')
    await page.setViewportSize({ width: 390, height: 844 });
  const artifact = {
    version: `staging-browser-v1-${'a'.repeat(64)}`,
    status: 'staging_only',
    text: 'C1RCLE STAGING PROMOTER AGREEMENT — FOR TESTING ONLY\nSynthetic local browser verification. No production acceptance.',
    textSha256: 'a'.repeat(64),
  };
  let application = {
    id: 'synthetic-application',
    userId: 'synthetic-promoter',
    status: 'draft',
    requestedType: 'promoter',
    plan: 'basic',
    profile: {
      legalName: 'Synthetic Promoter',
      contactPerson: 'Synthetic',
      phone: '+919000000001',
      city: 'Mumbai',
      entityType: 'individual',
    },
    documents: [],
    promoterAgreementAcceptances: [] as unknown[],
    missingDocuments: ['id_front', 'id_back', 'selfie'],
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    provisionedOrganizationId: null,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const user = {
    id: application.userId,
    email: 'synthetic@example.invalid',
    displayName: 'Synthetic Promoter',
    role: 'partner',
    avatarUrl: null,
    emailVerified: true,
  };
  await page.route('https://**/*', (route) => route.abort());
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({ json: { user, expiresAt: 4102444800 } }),
  );
  await page.route('**/api/auth/refresh', (route) =>
    route.fulfill({ json: { user, accessToken: 'synthetic-local-only', expiresAt: 4102444800 } }),
  );
  await page.route('**/api/bff/organizations', (route) => route.fulfill({ json: [] }));
  await page.route('**/api/bff/onboarding/me', (route) =>
    route.fulfill({ json: { request: application } }),
  );
  await page.route('**/api/bff/onboarding/promoter-agreement', (route) =>
    route.fulfill({ json: { agreement: artifact, activationAvailable: true } }),
  );
  let acceptCount = 0;
  await page.route(
    '**/api/bff/onboarding/applications/synthetic-application/promoter-agreement/accept',
    async (route) => {
      expect(route.request().postDataJSON()).toEqual({ version: artifact.version });
      acceptCount++;
      application = {
        ...application,
        promoterAgreementAcceptances: [
          {
            version: artifact.version,
            artifactStatus: artifact.status,
            textSha256: artifact.textSha256,
            acceptedBy: user.id,
            acceptedAt: new Date().toISOString(),
          },
        ],
        version: 2,
      };
      await route.fulfill({ json: application });
    },
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({ json: { user, accessToken: 'synthetic-local-only', expiresAt: 4102444800 } }),
  );
  await page.goto('/login?next=%2Fonboard');
  await page.getByRole('button', { name: /Promoter Sales/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByPlaceholder('you@company.com').fill(user.email);
  await page.getByPlaceholder('Enter your password').fill('Synthetic-local-only-password');
  await page.getByRole('button', { name: 'Continue to Dashboard' }).click();
  await expect(page).toHaveURL(/\/onboard/);
  const panel = page.getByRole('region', { name: 'Promoter agreement' });
  await expect(panel).toBeVisible();
  await expect(panel.getByText(/This is not the production legal agreement/)).toBeVisible();
  const accept = panel.getByRole('button', { name: 'Accept agreement' });
  await expect(accept).toBeDisabled();
  expect(acceptCount).toBe(0);
  await page.screenshot({ path: testInfo.outputPath('agreement-review.png'), fullPage: true });
  await panel.getByRole('checkbox').check();
  await accept.click();
  await expect(panel.getByText('You accepted this version.')).toBeVisible();
  expect(acceptCount).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
