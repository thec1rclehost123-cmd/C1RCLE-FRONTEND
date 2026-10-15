/**
 * ─── Partner Onboarding E2E Suite ─────────────────────────────────────────────
 *
 * Drives the full /onboard wizard (OnboardingPage) against the built Next.js app.
 * All backend calls are intercepted with page.route() so no live gateway is
 * required — this runs cleanly in CI.
 *
 * Phone OTP: Firebase Identity Platform is bypassed by mocking
 * identitytoolkit.googleapis.com at the network level. `sendVerificationCode`
 * returns a synthetic sessionInfo so the SDK constructs a ConfirmationResult;
 * `signInWithPhoneNumber` (the confirm step) returns a synthetic idToken, which
 * the wizard then verifies via /api/v2/onboarding/verify-document.
 *
 * Playwright config (playwright.config.ts):
 *   - baseURL: http://127.0.0.1:3211
 *   - webServer: pnpm exec next start --port 3211
 *   - retries: 2 in CI
 *
 * URL routing: every onboarding call goes through the same-origin BFF
 *   - startOnboarding()  → POST /api/bff/onboarding/applications
 *   - saveProgress()     → PATCH /api/bff/onboarding/applications/:id
 *   - submit()           → POST /api/bff/onboarding/applications/:id/submit
 *   - uploadDocument()   → POST /api/bff/onboarding/applications/:id/documents/upload
 *   - getMine()          → GET /api/bff/onboarding/me
 * Only verify-document still calls the gateway directly.
 *
 * IMPORTANT — route precedence: Playwright resolves `page.route()` handlers in
 * reverse registration order (last registered wins). The URL-contract tests
 * therefore register their recording routes AFTER `mockOnboardingNetwork()`.
 */

import { expect, test, type Page, type Route } from '@playwright/test';

// ── Fixture helpers ──────────────────────────────────────────────────────────

const APP_ID = 'app_e2e_001';
const USER_ID = 'user_e2e_001';
const ACCESS_TOKEN = 'e2e-access-token';

function futureExpiry(): number {
  return Date.now() + 60 * 60 * 1000;
}

/** The `user` half of every auth response (`userSchema` from @c1rcle/contracts). */
function makeUser(email = 'test@example.com', displayName = 'John Doe') {
  return {
    id: USER_ID,
    email,
    displayName,
    role: 'partner',
    avatarUrl: null,
    mustChangePassword: false,
  };
}

/** `authBridgeResponseSchema` — the shape `/api/auth/{signup,login}` must return. */
function makeAuthBridgeResponse(email = 'test@example.com', displayName = 'John Doe') {
  return {
    user: makeUser(email, displayName),
    accessToken: ACCESS_TOKEN,
    expiresAt: futureExpiry(),
  };
}

function makeDocument(label: string) {
  return {
    label,
    storagePath: `uploads/${label}.jpg`,
    uploadedAt: new Date().toISOString(),
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    rejectionReason: null,
  };
}

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
 * Intercepts every BFF and gateway call the onboarding wizard makes.
 * Both the correct BFF path AND the direct-gateway path are intercepted for
 * write operations, so URL-contract tests can override the recorder on top.
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

  // ── /api/auth/signup — must return authBridgeResponseSchema ───────────────
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
      body: JSON.stringify(makeAuthBridgeResponse()),
    });
  });

  // ── /api/auth/login ───────────────────────────────────────────────────────
  await page.route('**/api/auth/login', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeAuthBridgeResponse()),
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

  // ── /api/bff/organizations — the post-signup membership load. Returning an
  // empty page keeps DashboardAuthProvider off the real (absent) gateway and
  // avoids any auth-redirect race while the wizard is on screen.
  await page.route('**/api/bff/organizations', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [],
        pageInfo: { page: 0, pageSize: 20, total: 0, hasNextPage: false },
      }),
    });
  });

  // ── POST: start application — both BFF and direct gateway paths ───────────
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
  for (const pattern of [
    `**/api/bff/onboarding/applications/${APP_ID}`,
    `**/api/v2/onboarding/applications/${APP_ID}`,
  ]) {
    await page.route(pattern, async (route: Route) => {
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
  }

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

  // ── KYC document upload via BFF — echo the uploaded slot back ─────────────
  // The wizard reads `documents.find(d => d.label === docLabel).storagePath`, so
  // the response must carry the label from the `?label=` query the uploader sent.
  await page.route(
    `**/api/bff/onboarding/applications/${APP_ID}/documents/upload**`,
    async (route: Route) => {
      const label = new URL(route.request().url()).searchParams.get('label') ?? 'id_front';
      const missing = ['id_front', 'id_back', 'selfie'].filter((slot) => slot !== label);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(
          makeApplicationDto({ documents: [makeDocument(label)], missingDocuments: missing }),
        ),
      });
    },
  );

  // ── /api/v2/onboarding/verify-document (direct gateway — correct) ─────────
  await page.route('**/api/v2/onboarding/verify-document', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ passed: true, provider: 'format', reason: null, referenceId: null }),
    });
  });

  // ── Firebase Identity Platform (phone OTP) ────────────────────────────────
  // The SDK (firebase/auth 12.x) probes reCAPTCHA Enterprise config first, then
  // sends/confirms the code. Each endpoint needs a correctly-shaped response:
  //   GET  /v2/recaptchaConfig   → { recaptchaKey, recaptchaEnforcementState }
  //   GET  /v1/recaptchaParams   → { recaptchaSiteKey }
  //   POST accounts:sendVerificationCode   → { sessionInfo }
  //   POST accounts:signInWithPhoneNumber  → { idToken, refreshToken, ... }
  // A wrong shape (e.g. recaptchaSiteKey missing) throws auth/internal-error
  // inside RecaptchaVerifier.init() before the code is ever sent.
  await page.route('**/identitytoolkit.googleapis.com/**', async (route: Route) => {
    const url = route.request().url();
    if (url.includes('recaptchaConfig')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          recaptchaKey: 'projects/c1rcle-v2/keys/e2e-test-site-key',
          recaptchaEnforcementState: [{ provider: 'PHONE_PROVIDER', enforcementState: 'ENFORCE' }],
        }),
      });
      return;
    }
    if (url.includes('recaptchaParams')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ recaptchaSiteKey: 'e2e-test-site-key' }),
      });
      return;
    }
    if (url.includes('signInWithPhoneNumber')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#VerifyPhoneNumberResponse',
          idToken: 'e2e-firebase-id-token',
          refreshToken: 'e2e-firebase-refresh-token',
          expiresIn: '3600',
          localId: 'e2e-firebase-local-id',
          isNewUser: false,
        }),
      });
      return;
    }
    if (url.includes('lookup')) {
      // getAccountInfo — the SDK reloads the user after confirm and asserts
      // `response.users.length`, so this shape (not `sessionInfo`) is required.
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          kind: 'identitytoolkit#GetAccountInfoResponse',
          users: [
            {
              localId: 'e2e-firebase-local-id',
              phoneNumber: '+919876543210',
              emailVerified: false,
              providerUserInfo: [],
            },
          ],
        }),
      });
      return;
    }
    // accounts:sendVerificationCode (and anything else)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ sessionInfo: 'e2e-session-info' }),
    });
  });

  // Secure token exchange (getIdToken refresh path), if the SDK requests one.
  await page.route('**/securetoken.googleapis.com/**', async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'e2e-firebase-id-token',
        id_token: 'e2e-firebase-id-token',
        refresh_token: 'e2e-firebase-refresh-token',
        expires_in: '3600',
        token_type: 'Bearer',
        user_id: 'e2e-firebase-local-id',
      }),
    });
  });
}

// ── Shared flow helpers ──────────────────────────────────────────────────────

/** The submit/advance button on each wizard step starts with "Continue". */
function continueButton(page: Page) {
  return page.getByRole('button', { name: /^Continue/ }).first();
}

/** Fills the signup form on the `signup` step. */
async function fillSignupForm(
  page: Page,
  opts: { name?: string; email?: string; password?: string } = {},
) {
  const name = opts.name ?? 'John Doe';
  const email = opts.email ?? 'test@example.com';
  const password = opts.password ?? 'Password1234';
  await page.getByLabel(/Full Name|Display Name/i).fill(name);
  await page.getByLabel(/Email Address/i).fill(email);
  await page.locator('input[type="password"]').first().fill(password);
}

/** Role step → signup step. */
async function selectRole(page: Page, role = /Venue/i) {
  await page.getByRole('button', { name: role }).first().click();
  await continueButton(page).click();
}

/** Signup → email OTP → phone OTP → entity type (individual) → details. */
async function advanceToDetails(page: Page, signup: { email?: string } = {}) {
  await fillSignupForm(page, signup);
  await continueButton(page).click();

  // Email OTP
  await page.getByRole('textbox', { name: /6-digit code/i }).fill('123456');
  await page.getByRole('button', { name: /Verify Email/i }).click();

  // Phone OTP (Firebase SDK mocked at the network layer)
  await page.getByLabel(/Mobile Number|Phone/i).fill('+919876543210');
  await page.getByRole('button', { name: /Send SMS Code/i }).click();
  await page.getByRole('textbox', { name: /6-digit SMS code/i }).fill('654321');
  await page.getByRole('button', { name: /Verify Phone/i }).click();

  // Entity type → details
  await page
    .getByRole('button', { name: /Individual/i })
    .first()
    .click();
  await continueButton(page).click();
  await expect(
    page.getByRole('heading', { name: /Venue Registration|Host Profile/i }),
  ).toBeVisible();
}

/** Fills the individual venue details form and advances to KYC. */
async function fillDetailsAndContinue(page: Page) {
  await page
    .getByLabel(/Venue Name|Legal Business Name|Brand|Your Full Name/i)
    .fill('Test Venue Pvt Ltd');
  await page.getByLabel(/Contact Person|Authorized Contact/i).fill('John Doe');
  await page.getByLabel(/Phone Number/i).fill('+919876543210');
  const city = page.getByRole('combobox', { name: /City/i });
  await city.click();
  await city.fill('Mumbai');
  await city.press('Enter');
  await continueButton(page).click();
}

/**
 * Completes the individual identity KYC step: choose Passport (no Aadhaar
 * format-check gate), enter a valid number, upload all three slots, submit.
 */
async function completeKycAndContinue(page: Page) {
  await page.getByRole('combobox', { name: /ID Type/i }).selectOption('passport');
  await page.getByLabel(/ID Number/i).fill('A1234567');

  const fileInputs = page.locator('input[type="file"]');
  const count = await fileInputs.count();
  for (let i = 0; i < count; i++) {
    await fileInputs.nth(i).setInputFiles({
      name: `document_${String(i)}.jpg`,
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-bytes'),
    });
  }

  const submit = continueButton(page);
  await expect(submit).toBeEnabled({ timeout: 15_000 });
  await submit.click();
}

// ── Test suite — happy paths and error paths ─────────────────────────────────

test.describe('Onboarding wizard — /onboard', () => {
  // ── 1. Happy path: individual / venue ──────────────────────────────────────
  test('happy path: individual venue walks all steps and lands on success screen', async ({
    page,
  }) => {
    await mockOnboardingNetwork(page);
    await page.goto('/onboard');

    // Step 1: Role selection
    await expect(page.getByRole('heading', { name: /Join the Network/i })).toBeVisible();
    await selectRole(page);

    // Step 2: Sign Up
    await expect(page.getByRole('heading', { name: /Create Your Account/i })).toBeVisible();
    await fillSignupForm(page);
    await continueButton(page).click();

    // Step 3: Email verification OTP
    await expect(page.getByRole('textbox', { name: /6-digit code/i })).toBeVisible();
    await page.getByRole('textbox', { name: /6-digit code/i }).fill('123456');
    await page.getByRole('button', { name: /Verify Email/i }).click();

    // Step 4: Phone verification — enter number, send, verify
    await expect(page.getByLabel(/Mobile Number|Phone/i)).toBeVisible();
    await page.getByLabel(/Mobile Number|Phone/i).fill('+919876543210');
    await page.getByRole('button', { name: /Send SMS Code/i }).click();
    await page.getByRole('textbox', { name: /6-digit SMS code/i }).fill('654321');
    await page.getByRole('button', { name: /Verify Phone/i }).click();

    // Step 5: Entity type
    await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeVisible();
    await page
      .getByRole('button', { name: /Individual/i })
      .first()
      .click();
    await continueButton(page).click();

    // Step 6: Details / Profile
    await expect(page.getByRole('heading', { name: /Venue Registration/i })).toBeVisible();
    await page
      .getByLabel(/Venue Name|Legal Business Name|Brand|Your Full Name/i)
      .fill('Test Venue Pvt Ltd');
    await page.getByLabel(/Contact Person|Authorized Contact/i).fill('John Doe');
    const city = page.getByRole('combobox', { name: /City/i });
    await city.click();
    await city.fill('Mumbai');
    await city.press('Enter');
    await continueButton(page).click();

    // Step 7: KYC Identity — pick Passport, enter number, upload documents
    await expect(page.getByRole('heading', { name: /Verify Your Identity/i })).toBeVisible();
    await completeKycAndContinue(page);

    // Step 8: Success screen
    await expect(page.getByRole('heading', { name: /Application Submitted/i })).toBeVisible();
    await expect(page.getByText(/under review/i)).toBeVisible();
  });

  // ── 2. Landing state ────────────────────────────────────────────────────────
  test('wizard shows the correct heading when navigated to /onboard', async ({ page }) => {
    // With no existing application and no auth session, the wizard starts at `role`.
    await mockOnboardingNetwork(page, { existingApplication: null });
    await page.goto('/onboard');
    await expect(page.getByRole('heading', { name: /Join the Network/i })).toBeVisible();
  });

  // ── 3. Returning user — existing email branch ──────────────────────────────
  test('existing-email 409 surfaces the "Welcome Back" login recovery UI', async ({ page }) => {
    await mockOnboardingNetwork(page, { signupConflict: true });
    await page.goto('/onboard');

    await selectRole(page);

    // Attempt signup with conflicting email
    await fillSignupForm(page, { email: 'existing@example.com' });
    await continueButton(page).click();

    // The wizard flips to the in-place login ("Welcome Back") form.
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    await expect(page.getByText('This email is already registered.')).toBeVisible();
    await expect(page.getByLabel(/Password/i)).toBeVisible();
  });

  // ── 4. Business entity path shows extra KYC steps ─────────────────────────
  test('choosing Business entity type adds business and signatory steps to the navigator', async ({
    page,
  }) => {
    await mockOnboardingNetwork(page);
    await page.goto('/onboard');
    await selectRole(page);
    await advanceToDetails(page);

    // Go back to the entity-type step and choose Business, then continue.
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeVisible();
    await page
      .getByRole('button', { name: /Business/i })
      .first()
      .click();
    await continueButton(page).click();

    // The step navigator now includes Business and Signatory labels. Wait for
    // the entity-type cards to exit so the exact text "Business" is unique to
    // the navigator (the Business RoleCard also renders an "Business" heading).
    await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeHidden();
    await expect(page.getByText('Business', { exact: true })).toBeVisible();
    await expect(page.getByText('Signatory', { exact: true })).toBeVisible();
  });

  // ── 5. Submit blocked on missing documents ─────────────────────────────────
  test('400 from submit surfaces an actionable "upload all documents" error', async ({ page }) => {
    await mockOnboardingNetwork(page, { submitMissingDocs: true });
    await page.goto('/onboard');

    await selectRole(page);
    await advanceToDetails(page);
    await fillDetailsAndContinue(page);

    // Fill the KYC step (so the button enables), then the submit call 400s.
    await completeKycAndContinue(page);

    await expect(page.getByText(/required documents|upload all|missing documents/i)).toBeVisible();
  });
});

// ── URL contract assertions ──────────────────────────────────────────────────
// These tests verify which HTTP path each wizard step calls. They serve as a
// regression net: start/saveProgress/submit must go through the same-origin BFF
// (only verify-document may call the gateway directly).
//
// Recording routes are registered AFTER mockOnboardingNetwork so they take
// precedence (Playwright resolves handlers last-registered-first).

test.describe('Onboarding wizard — URL contract', () => {
  test('email OTP send calls /api/auth/otp/send (BFF), not the raw gateway', async ({ page }) => {
    const bffHits: string[] = [];
    const gatewayDirectHits: string[] = [];

    await mockOnboardingNetwork(page);

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
    await selectRole(page);
    await fillSignupForm(page);
    await continueButton(page).click();

    // sendOtp() is called inside handleSignup — it MUST go through the BFF.
    await expect(page.getByRole('textbox', { name: /6-digit code/i })).toBeVisible();
    expect(bffHits).toContain('/api/auth/otp/send');
    expect(gatewayDirectHits).toHaveLength(0);
  });

  test('application start (POST) hits the BFF, never the direct gateway', async ({ page }) => {
    const startHits: string[] = [];

    await mockOnboardingNetwork(page);

    await page.route('**/api/bff/onboarding/applications', async (route) => {
      if (route.request().method() === 'POST') {
        startHits.push('BFF:' + new URL(route.request().url()).pathname);
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(makeApplicationDto()),
      });
    });

    await page.route('**/api/v2/onboarding/applications', async (route) => {
      if (route.request().method() === 'POST') {
        startHits.push('GATEWAY:' + new URL(route.request().url()).pathname);
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(makeApplicationDto()),
      });
    });

    await page.goto('/onboard');
    await selectRole(page);
    await advanceToDetails(page);
    await fillDetailsAndContinue(page);

    // The wizard must reach KYC (proving the application was opened) via BFF only.
    await expect(page.getByRole('heading', { name: /Verify Your Identity/i })).toBeVisible();
    expect(startHits).toContain('BFF:/api/bff/onboarding/applications');
    expect(startHits.filter((h) => h.startsWith('GATEWAY:'))).toHaveLength(0);
  });

  test('verify-document calls /api/v2/onboarding/verify-document (direct gateway — correct)', async ({
    page,
  }) => {
    const directGatewayHits: string[] = [];
    const bffHits: string[] = [];

    await mockOnboardingNetwork(page);

    await page.route('**/api/v2/onboarding/verify-document', async (route) => {
      directGatewayHits.push(new URL(route.request().url()).pathname);
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

    await page.goto('/onboard');
    await selectRole(page);
    await fillSignupForm(page);
    await continueButton(page).click();
    await page.getByRole('textbox', { name: /6-digit code/i }).fill('123456');
    await page.getByRole('button', { name: /Verify Email/i }).click();

    // Phone OTP — send code, enter verification code (verify-document for phone).
    await page.getByLabel(/Mobile Number|Phone/i).fill('+919876543210');
    await page.getByRole('button', { name: /Send SMS Code/i }).click();
    await page.getByRole('textbox', { name: /6-digit SMS code/i }).fill('654321');
    await page.getByRole('button', { name: /Verify Phone/i }).click();

    // verify-document must go direct to the gateway (no BFF wrapper exists — by design).
    await expect(page.getByRole('heading', { name: /Individual or Business/i })).toBeVisible();
    expect(directGatewayHits).toContain('/api/v2/onboarding/verify-document');
    expect(bffHits).toHaveLength(0);
  });
});
