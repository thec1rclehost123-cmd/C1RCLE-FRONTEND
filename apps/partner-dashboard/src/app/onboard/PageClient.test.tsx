/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/non-nullable-type-assertion-style, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion, unused-imports/no-unused-vars */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClientError } from '@c1rcle/api-client';

import { OnboardingPage } from './PageClient';

const apiError = (init: {
  code: ApiClientError['code'];
  message: string;
  status: number;
  fieldErrors?: Record<string, string[]>;
}) => new ApiClientError({ requestId: undefined, fieldErrors: undefined, ...init });

const mocks = vi.hoisted(() => ({
  auth: { user: null as any, loading: false, isApproved: false },
  getMine: vi.fn(),
  saveProgress: vi.fn(),
  start: vi.fn(),
  submit: vi.fn(),
  uploadDocument: vi.fn(),
  verifyDocument: vi.fn(),
  sendPhoneOtp: vi.fn(),
  confirmPhoneOtp: vi.fn(),
  sendOtp: vi.fn(),
  verifyOtp: vi.fn(),
  routeAfterAuth: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: unknown }) => children,
  motion: new Proxy(
    {},
    {
      get:
        (_t, tag: string) =>
        ({ children, initial, animate, exit, transition, whileHover, whileTap, ...rest }: any) =>
          createElement(tag, rest, children),
    },
  ),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mocks.replace, push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/components/providers/DashboardAuthProvider', () => ({
  useDashboardAuth: () => ({
    user: mocks.auth.user,
    loading: mocks.auth.loading,
    isApproved: mocks.auth.isApproved,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));
vi.mock('@/lib/firebase/phone-auth', () => ({
  confirmPhoneOtp: mocks.confirmPhoneOtp,
  sendPhoneOtp: mocks.sendPhoneOtp,
  getTestingBypassEnabled: () => false,
}));
vi.mock('@/lib/onboarding/onboarding-repository', () => ({
  getMine: mocks.getMine,
  saveProgress: mocks.saveProgress,
  start: mocks.start,
  submit: mocks.submit,
  uploadDocument: mocks.uploadDocument,
  verifyDocument: mocks.verifyDocument,
}));
vi.mock('@/lib/onboarding/otp', () => ({ sendOtp: mocks.sendOtp, verifyOtp: mocks.verifyOtp }));
vi.mock('@/lib/org/route-after-auth', () => ({ routeAfterAuth: mocks.routeAfterAuth }));

const dto = (extra: Record<string, unknown> = {}, profile: Record<string, unknown> = {}) => ({
  id: 'req_1',
  userId: 'user_1',
  status: 'draft',
  requestedType: 'venue',
  plan: 'basic',
  profile: {
    legalName: 'Acme',
    contactPerson: 'A',
    phone: '+919876543210',
    city: 'Pune',
    ...profile,
  },
  documents: [],
  missingDocuments: ['id_front', 'id_back', 'selfie'],
  submittedAt: null,
  version: 1,
  ...extra,
});

const withDoc = (label: string) => ({
  documents: [{ label, storagePath: `path/${label}`, status: 'pending' }],
});

const png = () => new File([new Uint8Array([1])], 'x.png', { type: 'image/png' });

function fileInputs(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

async function upload(input: HTMLInputElement, label: string) {
  mocks.uploadDocument.mockResolvedValueOnce(dto(withDoc(label)));
  fireEvent.change(input, { target: { files: [png()] } });
  await waitFor(() => {
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
  });
}

describe('Partner onboarding wizard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.auth.user = { id: 'user_1', email: 'a@b.co' };
    mocks.auth.loading = false;
    mocks.auth.isApproved = false;
  });

  describe('resume from saved progress', () => {
    it('restarts at the role step when signed out', async () => {
      mocks.auth.user = null;
      render(<OnboardingPage />);
      expect(await screen.findByText(/back to login/i)).toBeInTheDocument();
      expect(mocks.getMine).not.toHaveBeenCalled();
    });

    it('goes to phone verification when signed in with no application yet', async () => {
      mocks.getMine.mockResolvedValue(null);
      render(<OnboardingPage />);
      expect(await screen.findByText('Confirm Your Number')).toBeInTheDocument();
    });

    it('resumes an individual draft with missing docs at the identity KYC step', async () => {
      mocks.getMine.mockResolvedValue(dto());
      render(<OnboardingPage />);
      expect(await screen.findByText('Verify Your Identity')).toBeInTheDocument();
    });

    it('resumes a business draft at the business documents step', async () => {
      mocks.getMine.mockResolvedValue(dto({}, { entityType: 'business' }));
      render(<OnboardingPage />);
      expect(await screen.findByText('Business Documents', { selector: 'h1' })).toBeInTheDocument();
    });

    it('resumes at the last KYC step when no documents are missing', async () => {
      mocks.getMine.mockResolvedValue(dto({ missingDocuments: [] }));
      render(<OnboardingPage />);
      expect(await screen.findByText('Verify Your Identity')).toBeInTheDocument();
    });

    it.each([
      ['submitted', 'Application Submitted'],
      ['rejected', 'Application Rejected'],
    ])('shows the success screen for a %s application', async (status, text) => {
      mocks.getMine.mockResolvedValue(dto({ status, missingDocuments: [] }));
      render(<OnboardingPage />);
      expect(await screen.findByText(text)).toBeInTheDocument();
    });

    it('routes an approved user away from the wizard', async () => {
      mocks.auth.isApproved = true;
      render(<OnboardingPage />);
      await waitFor(() => {
        expect(mocks.routeAfterAuth).toHaveBeenCalled();
      });
    });
  });

  describe('phone verification gating', () => {
    async function openPhoneStep() {
      mocks.getMine.mockResolvedValue(null);
      const user = userEvent.setup();
      const view = render(<OnboardingPage />);
      await screen.findByText('Confirm Your Number');
      return { user, ...view };
    }

    it('rejects an invalid number without calling Firebase', async () => {
      const { user } = await openPhoneStep();
      await user.click(screen.getByRole('button', { name: /send sms code/i }));
      expect(await screen.findByText(/valid 10-digit Indian mobile number/i)).toBeInTheDocument();
      expect(mocks.sendPhoneOtp).not.toHaveBeenCalled();
    });

    it('requires a full 6-digit code and a passing server check before advancing', async () => {
      mocks.sendPhoneOtp.mockResolvedValue({ confirm: vi.fn() });
      const { user } = await openPhoneStep();
      const phone = screen.getByPlaceholderText('+91 98765 43210');
      fireEvent.change(phone, { target: { value: '+919876543210' } });
      await user.click(screen.getByRole('button', { name: /send sms code/i }));
      await waitFor(() => {
        expect(mocks.sendPhoneOtp).toHaveBeenCalledWith('+919876543210', 'phone-verify-recaptcha');
      });

      await user.type(await screen.findByPlaceholderText('000000'), '123');
      await user.click(screen.getByRole('button', { name: /verify phone/i }));
      expect(await screen.findByText('Enter the 6-digit code.')).toBeInTheDocument();
      expect(mocks.confirmPhoneOtp).not.toHaveBeenCalled();

      mocks.confirmPhoneOtp.mockResolvedValue('id-token');
      mocks.verifyDocument.mockResolvedValue({ passed: false, reason: 'Number mismatch' });
      fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '123456' } });
      await user.click(screen.getByRole('button', { name: /verify phone/i }));
      expect(await screen.findByText('Number mismatch')).toBeInTheDocument();
      expect(screen.queryByText('Individual or Business?')).not.toBeInTheDocument();

      mocks.verifyDocument.mockResolvedValue({ passed: true });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /verify phone/i })).toBeEnabled();
      });
      await user.click(screen.getByRole('button', { name: /verify phone/i }));
      expect(
        await screen.findByText('Individual or Business?', {}, { timeout: 15_000 }),
      ).toBeInTheDocument();
      expect(mocks.verifyDocument).toHaveBeenLastCalledWith({
        documentType: 'phone',
        documentNumber: '+919876543210',
        proofToken: 'id-token',
      });
    });
  });

  describe('individual KYC (id_front, id_back, selfie)', () => {
    async function openIdentity() {
      mocks.getMine.mockResolvedValue(dto());
      const user = userEvent.setup();
      const view = render(<OnboardingPage />);
      await screen.findByText('Verify Your Identity');
      return { user, ...view };
    }

    it('uploads each slot with its own label via the repository', async () => {
      const { container } = await openIdentity();
      const [front, back, selfie] = fileInputs(container);
      expect(fileInputs(container)).toHaveLength(3);
      await upload(front as HTMLInputElement, 'id_front');
      await upload(back as HTMLInputElement, 'id_back');
      await upload(selfie as HTMLInputElement, 'selfie');

      expect(mocks.uploadDocument.mock.calls.map((c) => c[1])).toEqual([
        'id_front',
        'id_back',
        'selfie',
      ]);
      expect(mocks.uploadDocument.mock.calls[0]?.[0]).toBe('req_1');
      expect(mocks.uploadDocument.mock.calls[0]?.[2]).toBeInstanceOf(File);
      expect(typeof mocks.uploadDocument.mock.calls[0]?.[3]).toBe('string');
    });

    it('rejects oversized and non-image files before any upload', async () => {
      const { container } = await openIdentity();
      const [front] = fileInputs(container);
      const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
      fireEvent.change(front as HTMLInputElement, { target: { files: [big] } });
      expect(await screen.findByText('File must be under 5MB.')).toBeInTheDocument();
      const pdf = new File(['x'], 'a.pdf', { type: 'application/pdf' });
      fireEvent.change(front as HTMLInputElement, { target: { files: [pdf] } });
      expect(await screen.findByText(/JPG, PNG, or WEBP image/)).toBeInTheDocument();
      expect(mocks.uploadDocument).not.toHaveBeenCalled();
    });

    it('shows the upload error and keeps the slot empty when the upload fails', async () => {
      const { container } = await openIdentity();
      mocks.uploadDocument.mockRejectedValue(new Error('Storage unavailable'));
      fireEvent.change(fileInputs(container)[0] as HTMLInputElement, {
        target: { files: [png()] },
      });
      expect(await screen.findByText('Storage unavailable')).toBeInTheDocument();
      expect(screen.queryByText('Uploaded')).not.toBeInTheDocument();
    });

    it('blocks Continue until all docs are uploaded and the ID fields are filled, then submits once', async () => {
      const { container, user } = await openIdentity();
      const next = screen.getByRole('button', { name: /continue/i });
      expect(next).toBeDisabled();

      const [front, back, selfie] = fileInputs(container) as HTMLInputElement[];
      await upload(front as HTMLInputElement, 'id_front');
      await upload(back as HTMLInputElement, 'id_back');
      await upload(selfie as HTMLInputElement, 'selfie');
      expect(next).toBeDisabled(); // no ID type / number yet

      await user.selectOptions(screen.getByRole('combobox'), 'passport');
      await user.type(screen.getByPlaceholderText('Enter your ID number'), 'P1234567');
      expect(next).toBeEnabled();

      mocks.submit.mockResolvedValue(dto({ status: 'submitted', missingDocuments: [] }));
      await user.click(next);
      expect(await screen.findByText('Application Submitted')).toBeInTheDocument();
      expect(mocks.submit).toHaveBeenCalledTimes(1);
      expect(mocks.submit).toHaveBeenCalledWith('req_1', expect.any(String));
    });

    it('gates Aadhaar on the format check', async () => {
      const { container, user } = await openIdentity();
      for (const [i, label] of ['id_front', 'id_back', 'selfie'].entries()) {
        await upload(fileInputs(container)[i] as HTMLInputElement, label);
      }
      await user.selectOptions(screen.getByRole('combobox'), 'aadhaar');
      await user.type(screen.getByPlaceholderText('Enter your ID number'), '123412341234');
      const next = screen.getByRole('button', { name: /continue/i });
      expect(next).toBeDisabled();

      mocks.verifyDocument.mockResolvedValue({ passed: true });
      await user.click(screen.getByRole('button', { name: /check format/i }));
      await screen.findByText('Aadhaar format validated.');
      expect(mocks.verifyDocument).toHaveBeenCalledWith({
        documentType: 'aadhaar',
        documentNumber: '123412341234',
      });
      expect(next).toBeEnabled();
    });

    describe('submit errors', () => {
      async function fillAndSubmit(error: unknown) {
        const { container, user } = await openIdentity();
        for (const [i, label] of ['id_front', 'id_back', 'selfie'].entries()) {
          await upload(fileInputs(container)[i] as HTMLInputElement, label);
        }
        await user.selectOptions(screen.getByRole('combobox'), 'passport');
        await user.type(screen.getByPlaceholderText('Enter your ID number'), 'P1234567');
        mocks.submit.mockRejectedValue(error);
        await user.click(screen.getByRole('button', { name: /continue/i }));
      }

      it('joins 400 fieldErrors into the banner', async () => {
        await fillAndSubmit(
          apiError({
            code: 'validation',
            message: 'Invalid',
            status: 400,
            fieldErrors: { documents: ['selfie is missing'], profile: ['city required'] },
          }),
        );
        expect(await screen.findByText('selfie is missing city required')).toBeInTheDocument();
      });

      it('falls back to the upload-all-documents message on a bare 400', async () => {
        await fillAndSubmit(apiError({ code: 'validation', message: 'Bad', status: 400 }));
        expect(
          await screen.findByText('Please upload all required documents before submitting.'),
        ).toBeInTheDocument();
      });

      it('shows the server message for a 422', async () => {
        await fillAndSubmit(
          apiError({
            code: 'validation',
            message: 'Phone number is invalid',
            status: 422,
            fieldErrors: { phone: ['Phone number is invalid'] },
          }),
        );
        expect(await screen.findByText('Phone number is invalid')).toBeInTheDocument();
        expect(screen.queryByText('Application Submitted')).not.toBeInTheDocument();
      });
    });
  });

  describe('business KYC (registration_certificate, sig_id_front, sig_id_back, sig_selfie)', () => {
    it('walks business docs then signatory docs with the business label set and submits', async () => {
      mocks.getMine.mockResolvedValue(dto({}, { entityType: 'business' }));
      const user = userEvent.setup();
      const { container } = render(<OnboardingPage />);
      await screen.findByText('Business Documents', { selector: 'h1' });

      expect(fileInputs(container)).toHaveLength(1);
      const next = screen.getByRole('button', { name: /continue/i });
      expect(next).toBeDisabled();
      await user.type(screen.getByPlaceholderText('AAACB1234C'), 'ABCDE1234F');
      // Registered address has a 10-character floor — it has to be able to
      // match the registration certificate an admin checks it against.
      await user.type(
        screen.getByPlaceholderText('Full address as on documents'),
        '221B Linking Road, Mumbai',
      );
      expect(next).toBeDisabled(); // certificate still missing
      await upload(fileInputs(container)[0] as HTMLInputElement, 'registration_certificate');
      expect(next).toBeEnabled();
      await user.click(next);

      await screen.findByText('Authorized Representative', { selector: 'h1' });
      expect(fileInputs(container)).toHaveLength(3);
      const sigNext = screen.getByRole('button', { name: /continue/i });
      for (const [i, label] of ['sig_id_front', 'sig_id_back', 'sig_selfie'].entries()) {
        await upload(fileInputs(container)[i] as HTMLInputElement, label);
      }
      expect(sigNext).toBeDisabled(); // details + declaration missing

      await user.type(screen.getByPlaceholderText('As on government ID'), 'Jane Doe');
      const [designation, idType] = screen.getAllByRole('combobox');
      await user.selectOptions(designation as HTMLElement, 'director');
      await user.type(screen.getByPlaceholderText('representative@company.com'), 'j@d.co');
      await user.selectOptions(idType as HTMLElement, 'passport');
      await user.type(screen.getByPlaceholderText('Enter ID number'), 'P7654321');
      expect(sigNext).toBeDisabled(); // declaration unchecked
      await user.click(screen.getByRole('checkbox'));
      expect(sigNext).toBeEnabled();

      mocks.submit.mockResolvedValue(dto({ status: 'submitted', missingDocuments: [] }));
      await user.click(sigNext);
      expect(await screen.findByText('Application Submitted')).toBeInTheDocument();
      expect(mocks.uploadDocument.mock.calls.map((c) => c[1])).toEqual([
        'registration_certificate',
        'sig_id_front',
        'sig_id_back',
        'sig_selfie',
      ]);
      expect(mocks.submit).toHaveBeenCalledTimes(1);
    });
  });
});
