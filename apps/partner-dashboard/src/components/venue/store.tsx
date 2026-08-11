'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import type { ReqStatus, Screen } from './data';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type RequestsView = 'pending' | 'all';

interface VenueStudioValue {
  readonly go: (screen: Screen) => void;
  readonly calendarOpen: boolean;
  readonly setCalendarOpen: Dispatch<SetStateAction<boolean>>;
  readonly calSel: number;
  readonly setCalSel: Dispatch<SetStateAction<number>>;
  readonly calFloatOpen: boolean;
  readonly setCalFloatOpen: Dispatch<SetStateAction<boolean>>;
  readonly calFloatX: number;
  readonly calFloatY: number;
  readonly setCalFloatPos: (position: { readonly x: number; readonly y: number }) => void;
  readonly requestsView: RequestsView;
  readonly setRequestsView: Dispatch<SetStateAction<RequestsView>>;
  readonly requestOverrides: Readonly<Record<number, ReqStatus>>;
  readonly setRequestStatus: (id: number, status: ReqStatus) => void;
  readonly startCreate: () => void;
  readonly openEdit: () => void;
  readonly goBank: () => void;
}

const Ctx = createContext<VenueStudioValue | undefined>(undefined);

export function VenueStudioProvider({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calSel, setCalSel] = useState(16);
  const [calFloatOpen, setCalFloatOpen] = useState(false);
  const [calFloat, setCalFloat] = useState({ x: 420, y: 120 });
  const [requestsView, setRequestsView] = useState<RequestsView>('pending');
  const [requestOverrides, setRequestOverrides] = useState<Record<number, ReqStatus>>({});

  const go = useCallback(
    (screen: Screen) => {
      const routeByScreen: Record<Screen, string> = {
        overview: '/venue/overview',
        events: '/venue/events',
        eventDetail: '/venue/events',
        slotRequests: '/venue/slot-requests',
        audience: '/venue/partners',
        create: '/venue/events/create',
        marketing: '/venue/marketing',
        finance: '/venue/finance',
        door: '/venue/door',
        settings: '/venue/settings',
      };
      setCalendarOpen(false);
      router.push(routeByScreen[screen]);
      window.scrollTo(0, 0);
    },
    [router],
  );

  const setRequestStatus = useCallback((id: number, status: ReqStatus) => {
    setRequestOverrides((current) => ({ ...current, [id]: status }));
  }, []);
  const startCreate = useCallback(() => {
    router.push('/venue/events/create');
  }, [router]);
  const openEdit = useCallback(() => {
    router.push('/venue/events/create?mode=edit');
  }, [router]);
  const goBank = useCallback(() => {
    router.push('/venue/settings?tab=payout');
  }, [router]);
  const setCalFloatPos = useCallback((position: { readonly x: number; readonly y: number }) => {
    setCalFloat(position);
  }, []);

  const value = useMemo<VenueStudioValue>(
    () => ({
      go,
      calendarOpen,
      setCalendarOpen,
      calSel,
      setCalSel,
      calFloatOpen,
      setCalFloatOpen,
      calFloatX: calFloat.x,
      calFloatY: calFloat.y,
      setCalFloatPos,
      requestsView,
      setRequestsView,
      requestOverrides,
      setRequestStatus,
      startCreate,
      openEdit,
      goBank,
    }),
    [
      calFloat.x,
      calFloat.y,
      calFloatOpen,
      calSel,
      calendarOpen,
      go,
      goBank,
      openEdit,
      requestOverrides,
      requestsView,
      setCalFloatPos,
      setRequestStatus,
      startCreate,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVenueStudio(): VenueStudioValue {
  const context = useContext(Ctx);
  if (!context) throw new Error('useVenueStudio must be used within VenueStudioProvider');
  return context;
}
