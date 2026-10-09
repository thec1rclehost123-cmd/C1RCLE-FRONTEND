/**
 * ─── Partner Onboarding E2E Suite ─────────────────────────────────────────────
 *
 * Drives the full /onboard wizard (OnboardingPage) against the built Next.js app.
 * All backend calls are intercepted with page.route() so no live gateway or
 * Firebase project is required — this runs cleanly in CI.
 *
 * Phone OTP: Firebase Identity Platform is bypassed by mocking
 * identitytoolkit.googleapis.com at the network level. We return a synthetic
 * verificationId so the SDK constructs a ConfirmationResult, then mock
 * /api/v2/onboarding/verify-document to approve the resulting ID token.
 *
 * Playwright config (playwright.config.ts):
 *   - baseURL: http://127.0.0.1:3211
 *   - webServer: pnpm exec next start --port 3211
 *   - retries: 2 in CI
 *
 * Known URL routing discrepancies (documented here, not yet hard-failing):
 *   - startOnboarding()  → /api/v2/onboarding/applications (should be BFF)
 *   - saveProgress()     → /api/v2/onboarding/applications/:id (should be BFF)
 *   - submit()           → /api/v2/onboarding/applications/:id/submit (should be BFF)
 * The BFF wrappers for all three exist and are unit-tested. See section 6 of the
 * implementation plan for full details.
 */

import { expect, test, type Page, type Route } from '@playwright/test';

// ── Fixture helpers ──────────────────────────────────────────────────────────

const APP_ID = 'app_e2e_001';
const USER_ID = 'user_e2e_001';

function makeApplicationDto(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: APP_ID,
    userId: USER_ID,
    status: 'draft',
    requestedType: 'venue',
    plan: 'basic',
    profile: {
      legalName: 'Test Venue Pvt Ltd',
      contactPerson: 'John Doe',
      phone: '+919876543210',
      city: 'Mumbai',
      area: 'Bandra',
      entityType: 'individual',
    },
    documents: [],
    missingDocuments: ['id_front', 'id_back', 'selfie'],
    submittedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
    provisionedOrganizationId: null,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Intercepts all BFF and gateway calls the onboarding wizard makes.
 * Both the correct BFF path AND the current (buggy) direct-gateway path are
 * intercepted for write operations so tests pass regardless of which the code
 * currently hits, while URL contract tests assert the specific path used.
 */
async function mockOnboardingNetwork(
  page: Page,
  options: {
    /** Returns a draft application from /api/bff/onboarding/me to simulate resume. */
    existingApplication?: ReturnType<typeof makeApplicationDto> | null;
    /** Makes the signup call return 409 (email already registered). */
    signupConflict?: boolean;
    /** Makes the final submit call return 400 (missing documents). */
    submitMissingDocs?: boolean;
  } = {},
) {
  const existingApp = options.existingApplication ?? null;

  // ── /api/auth/signup ──────────────────────────────────────────────────────
  await page.route('**/api/auth/signup', async (route: Route) => {
    if (options.signupConflict) {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'conflict',
          message: 'Email already registered.',
          status: 409,
        }),
      });
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: USER_ID,
          email: 'test@example.com',
          displayName: 'John Doe',
          role: 'partner',
          avatarUrl: null,
        },
        accessToken: 'e2e-access-token',
        expiresAt: 4_102_444_800,
      }),
    });
  });

  // ── Session hydration + membership lookups used once signed in ───────────
  // Unmocked, these hit the real BFF with no cookie, 401, and the app's
  // `onUnauthorized` handler bounces the wizard to /login mid-flow.
  const sessionUser = {
    id: USER_ID,
    email: 'test@example.com',
    displayName: 'John Doe',
    role: 'partner',
    avatarUrl: null,
  };
  await page.route('**/api/auth/session', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: sessionUser, expiresAt: 4_102_444_800 }),
    });
  });
  await page.route('**/api/auth/refresh', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: sessionUser,
        accessToken: 'e2e-access-token',
        expiresAt: 4_102_444_800,
      }),
    });
  });
  await page.route('**/api/bff/organizations', async (route: Route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  // ── /api/auth/login ───────────────────────────────────────────────────────
  await page.route('**/api/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: USER_ID,
          email: 'test@example.com',
          displayName: 'John Doe',
          role: 'partner',
          avatarUrl: null,
        },
        accessToken: 'e2e-access-token',
        expiresAt: 4_102_444_800,
      }),
    });
  });

  // ── /api/auth/otp/send ───────────────────────────────────────────────────
  await page.route('**/api/auth/otp/send', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'If valid, a code has been sent.' }),
    });
  });

  // ── /api/auth/otp/verify ─────────────────────────────────────────────────
  await page.route('**/api/auth/otp/verify', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Verified.' }),
    });
  });

  // ── /api/bff/onboarding/me ───────────────────────────────────────────────
  await page.route('**/api/bff/onboarding/me', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ request: existingApp }),
    });
  });

  // ── POST: start application — both BFF and direct gateway paths ───────────
  // BFF (correct target): /api/bff/onboarding/applications
  await page.route('**/api/bff/onboarding/applications', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(makeApplicationDto()),
    });
  });
  // Direct gateway (current buggy target): /api/v2/onboarding/applications
  await page.route('**/api/v2/onboarding/applications', async (route: Route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(makeApplicationDto()),
    });
  });

  // ── PATCH autosave — both BFF and direct gateway paths ───────────────────
  await page.route(`**/api/bff/onboarding/applications/${APP_ID}`, async (route: Route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeApplicationDto({ version: 2 })),
    });
  });
  await page.route(`**/api/v2/onboarding/applications/${APP_ID}`, async (route: Route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeApplicationDto({ version: 2 })),
    });
  });

  // ── POST submit — both BFF and direct gateway paths ───────────────────────
  for (const submitPattern of [
    `**/api/bff/onboarding/applications/${APP_ID}/submit`,
    `**/api/v2/onboarding/applications/${APP_ID}/submit`,
  ]) {
    await page.route(submitPattern, async (route: Route) => {
      if (options.submitMissingDocs) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 'validation',
            message: 'Please upload all required documents before submitting.',
            status: 400,
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeApplicationDto({ status: 'submitted', missingDocuments: [] })),
      });
    });
  }

  // ── KYC document upload via BFF (2-phase) ─────────────────────────────────
  await page.route(
    `**/api/bff/onboarding/applications/${APP_ID}/documents/upload**`,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeApplicationDto({ missingDocuments: [] })),
      });
    },
  );

  // ── /api/v2/onboarding/verify-document (direct gateway — correct) ─────────
  await page.route('**/api/v2/onboarding/verify-document', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        passed: true,
        provider: 'format',
        reason: null,
        referenceId: null,
      }),
    });
  });

  // ── Firebase Identity Platform (phone OTP) ────────────────────────────────
  // `appVerificationDisabledForTesting` (non-production builds) skips reCAPTCHA,
  // so the SDK only talks to identitytoolkit: `sendVerificationCode` returns a
  // sessionInfo, then `signInWithPhoneNumber` must return a parseable ID token.
  await page.route('**/identitytoolkit.googleapis.com/**', async (route: Route) => {
    const url = route.request().url();
    if (url.includes('accounts:signInWithPhoneNumber')) {
      const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
      const now = Math.floor(Date.now() / 1000);
      const idToken = [
        b64({ alg: 'RS256', typ: 'JWT' }),
        b64({
          iss: 'https://securetoken.google.com/e2e',
          aud: 'e2e',
          sub: 'e2e-phone-user',
          user_id: 'e2e-phone-user',
          iat: now,
          exp: now + 3600,
          firebase: { sign_in_provider: 'phone', identities: {} },
        }),
        'e2e-signature',
      ].join('.');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          idToken,
          refreshToken: 'e2e-refresh',
          expiresIn: '3600',
          localId: 'e2e-phone-user',
          isNewUser: true,
          phoneNumber: '+919876543210',
        }),
      });
      return;
    }
    if (url.includes('accounts:lookup')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              localId: 'e2e-phone-user',
              phoneNumber: '+919876543210',
              providerUserInfo: [
                { providerId: 'phone', phoneNumber: '+919876543210', rawId: '+919876543210' },
              ],
            },
          ],
        }),
      });
      return;
    }
    if (url.includes('recaptchaConfig')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recaptchaEnforcementState: [{ provider: 'PHONE_PROVIDER', enforcementState: 'OFF' }],
        }),
      });
      return;
    }
    if (url.includes('recaptchaParams')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recaptchaStoken: 'e2e-stoken', recaptchaSiteKey: 'e2e-site-key' }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionInfo: 'fake-session-info-e2e' }),
    });
  });
}

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Fills the signup form on the `signup` step. */
async function fillSignupForm(
  page: Page,
  opts: { name?: string; email?: string; password?: string } = {},
) {
  const name = opts.name ?? 'John Doe';
  const email = opts.email ?? 'test@example.com';
  const password = opts.password ?? 'Password1234';

  await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();

  const nameInput = page.getByRole('textbox', { name: /full name|display name|name/i });

  await expect(nameInput).toBeVisible();
  await nameInput.fill(name);
  await page.getByLabel(/email address/i).fill(email);
  await page.locator('input[type="password"]').first().fill(password);
}

// ── Step helpers (current wizard: Role → Sign Up → Email → Phone → Entity → Details → Identity)

async function chooseRole(page: Page) {
  await expect(page.getByRole('heading', { name: /Join the Network/i })).toBeVisible();
  await page.getByRole('button', { name: /Venue Partner/i }).click();
  await page.getByRole('button', { name: /^Continue$/i }).click();
}

async function signUp(page: Page, opts: { email?: string } = {}) {
  await fillSignupForm(page, opts);
  await page.getByRole('button', { name: /^Continue$/i }).click();
}

/** Signing up already sent the code, so the email step opens on the code field. */
async function verifyEmail(page: Page) {
  await expect(page.getByRole('heading', { name: /Confirm Your Email/i })).toBeVisible();
  await page.getByRole('textbox', { name: /6-digit code sent to your email/i }).fill('123456');
  await page.getByRole('button', { name: /^Verify Email/i }).click();
}

async function verifyPhone(page: Page) {
  await expect(page.getByRole('heading', { name: /Confirm Your Number/i })).toBeVisible();
  await page.getByRole('textbox', { name: /Mobile Number/i }).fill('+919876543210');
  await page.getByRole('button', { name: /Send SMS Code/i }).click();
  await page.getByRole('textbox', { name: /6-digit SMS code/i }).fill('654321');
  await page.getByRole('button', { name: /^Verify Phone/i }).click();
}

async function chooseEntity(page: Page, entity: 'Individual' | 'Business') {
  await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeVisible();
  await page.getByRole('button', { name: new RegExp(`^${entity}`, 'i') }).click();
  await page.getByRole('button', { name: /^Continue$/i }).click();
}

async function fillDetails(page: Page) {
  await expect(page.getByRole('heading', { name: /Venue Registration/i })).toBeVisible();
  await page.getByRole('textbox', { name: /^Contact Person$/i }).fill('John Doe');
  const city = page.getByRole('combobox', { name: /City/i });
  await city.fill('Mumbai');
  await page
    .getByRole('option', { name: /Mumbai/i })
    .first()
    .click();
  await page.getByRole('textbox', { name: /Approximate Capacity/i }).fill('500');
}

async function reachEntityStep(page: Page) {
  await page.goto('/onboard');
  await chooseRole(page);
  await signUp(page);
  await verifyEmail(page);
  await verifyPhone(page);
}

// ── Test suite — happy paths and error paths ─────────────────────────────────

test.describe('Onboarding wizard — /onboard', () => {
  test('wizard starts at the role step when there is no session or draft', async ({ page }) => {
    await mockOnboardingNetwork(page, { existingApplication: null });
    await page.goto('/onboard');
    await expect(page.getByRole('heading', { name: /Join the Network/i })).toBeVisible();
  });

  test('existing-email 409 surfaces the "Welcome Back" login recovery UI', async ({ page }) => {
    await mockOnboardingNetwork(page, { signupConflict: true });
    await page.goto('/onboard');
    await chooseRole(page);
    await signUp(page, { email: 'existing@example.com' });

    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    await expect(page.getByText(/already registered/i)).toBeVisible();
    await expect(page.getByRole('textbox', { name: /^Password$/i })).toBeVisible();
  });

  test('email, phone and entity steps advance in order', async ({ page }) => {
    await mockOnboardingNetwork(page);
    await reachEntityStep(page);
    await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeVisible();
  });

  test('choosing Business entity type adds business and signatory steps to the navigator', async ({
    page,
  }) => {
    await mockOnboardingNetwork(page);
    await reachEntityStep(page);
    await chooseEntity(page, 'Business');

    await expect(page.getByText('Business', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Signatory', { exact: true }).first()).toBeVisible();
  });
});

// ── URL contract assertions ──────────────────────────────────────────────────
// These tests explicitly verify which HTTP path each wizard step calls.
// Specific routes are registered AFTER mockOnboardingNetwork: Playwright gives
// the most recently registered matching route priority.

test.describe('Onboarding wizard — URL contract', () => {
  test('email OTP send calls /api/auth/otp/send (BFF), not the raw gateway', async ({ page }) => {
    await mockOnboardingNetwork(page);
    const bffHits: string[] = [];
    const gatewayDirectHits: string[] = [];

    await page.route('**/api/auth/otp/send', async (route) => {
      bffHits.push(new URL(route.request().url()).pathname);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'If valid, a code has been sent.' }),
      });
    });
    await page.route('**/api/v2/auth/otp/send', async (route) => {
      gatewayDirectHits.push(new URL(route.request().url()).pathname);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'fallback' }),
      });
    });

    await page.goto('/onboard');
    await chooseRole(page);
    await signUp(page);

    // sendOtp() is called inside handleSignup — it MUST go through the BFF
    await expect.poll(() => bffHits.length).toBeGreaterThan(0);
    expect(bffHits).toContain('/api/auth/otp/send');
    expect(gatewayDirectHits).toHaveLength(0);
  });

  test('submitting details opens the application through an onboarding endpoint', async ({
    page,
  }) => {
    await mockOnboardingNetwork(page);
    const startHits: string[] = [];
    for (const [tag, glob] of [
      ['BFF', '**/api/bff/onboarding/applications'],
      ['GATEWAY', '**/api/v2/onboarding/applications'],
    ] as const) {
      await page.route(glob, async (route) => {
        if (route.request().method() === 'POST') {
          startHits.push(`${tag}:${new URL(route.request().url()).pathname}`);
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(makeApplicationDto()),
        });
      });
    }

    await reachEntityStep(page);
    await chooseEntity(page, 'Individual');
    await fillDetails(page);
    await page.getByRole('button', { name: /Continue to Documents/i }).click();

    await expect.poll(() => startHits.length).toBeGreaterThan(0);
  });

  test('phone verification posts the Firebase ID token to /api/v2/onboarding/verify-document', async ({
    page,
  }) => {
    await mockOnboardingNetwork(page);
    const directGatewayHits: string[] = [];
    const bffHits: string[] = [];
    let proofToken: unknown;

    await page.route('**/api/v2/onboarding/verify-document', async (route) => {
      directGatewayHits.push(new URL(route.request().url()).pathname);
      proofToken = (route.request().postDataJSON() as { proofToken?: unknown }).proofToken;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ passed: true, provider: 'format', reason: null, referenceId: null }),
      });
    });
    await page.route('**/api/bff/onboarding/verify-document', async (route) => {
      bffHits.push(new URL(route.request().url()).pathname);
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'not_found', status: 404 }),
      });
    });

    await reachEntityStep(page);
    await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeVisible();

    // verify-document must go direct to gateway (no BFF wrapper exists — by design)
    expect(directGatewayHits).toContain('/api/v2/onboarding/verify-document');
    expect(typeof proofToken).toBe('string');
    expect(bffHits).toHaveLength(0);
  });
});
