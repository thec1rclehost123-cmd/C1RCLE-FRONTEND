'use client';

/**
 * Venue Studio client state.
 *
 * Mirrors the `state` object of the design mockup's DCLogic component so screen
 * behaviour (tab memory, wizard step, filters, toggles) matches the prototype.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { DEFAULT_COMPOSER_TEXT } from './data';

import type { Audience, Channel, Metric, Range, ReqStatus, Screen } from './data';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

export type EventsView = 'list' | 'analytics';
export type DetailTab = 'sales' | 'guests' | 'tonight' | 'promoters';
export type AudienceSeg = 'venues' | 'promoters' | 'staff';
export type MarketingView = 'compose' | 'history' | 'templates';
export type FinanceView = 'payouts' | 'orders' | 'bank';
export type SettingsView = 'public' | 'menu' | 'account';
export type RequestsView = 'pending' | 'all';
export type PreviewFrame = 'pick' | 'guest' | 'mobile' | null;
export type OrdersSort = 'tickets' | 'amount' | null;

export interface PromoCode {
  code: string;
  type: string;
  limit: string;
}

interface VenueStudioValue {
  screen: Screen;
  go: (screen: Screen) => void;

  // overview
  metric: Metric;
  setMetric: Dispatch<SetStateAction<Metric>>;
  range: Range;
  setRange: Dispatch<SetStateAction<Range>>;

  // topbar
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  searchFocus: boolean;
  setSearchFocus: Dispatch<SetStateAction<boolean>>;
  notifOpen: boolean;
  setNotifOpen: Dispatch<SetStateAction<boolean>>;
  notifRead: boolean;
  setNotifRead: Dispatch<SetStateAction<boolean>>;

  // calendars
  calendarOpen: boolean;
  setCalendarOpen: Dispatch<SetStateAction<boolean>>;
  calSel: number;
  setCalSel: Dispatch<SetStateAction<number>>;
  calFloatOpen: boolean;
  setCalFloatOpen: Dispatch<SetStateAction<boolean>>;
  calFloatX: number;
  calFloatY: number;
  setCalFloatPos: (pos: { x: number; y: number }) => void;

  // events
  eventsView: EventsView;
  setEventsView: Dispatch<SetStateAction<EventsView>>;
  selectedEventIdx: number;
  setSelectedEventIdx: Dispatch<SetStateAction<number>>;
  detailTab: DetailTab;
  setDetailTab: Dispatch<SetStateAction<DetailTab>>;

  // slot requests
  requestsView: RequestsView;
  setRequestsView: Dispatch<SetStateAction<RequestsView>>;
  requestOverrides: Record<number, ReqStatus>;
  setRequestStatus: (id: number, status: ReqStatus) => void;

  // partners
  audienceSeg: AudienceSeg;
  setAudienceSeg: Dispatch<SetStateAction<AudienceSeg>>;
  venueTab: 'my' | 'discover';
  setVenueTab: Dispatch<SetStateAction<'my' | 'discover'>>;
  promoTab: 'my' | 'discover' | 'requests';
  setPromoTab: Dispatch<SetStateAction<'my' | 'discover' | 'requests'>>;

  // create event
  createStep: number;
  setCreateStep: Dispatch<SetStateAction<number>>;
  editMode: boolean;
  setEditMode: Dispatch<SetStateAction<boolean>>;
  dName: string;
  setDName: Dispatch<SetStateAction<string>>;
  dGrad: number;
  setDGrad: Dispatch<SetStateAction<number>>;
  dVenue: number;
  setDVenue: Dispatch<SetStateAction<number>>;
  dDay: number | null;
  setDDay: Dispatch<SetStateAction<number | null>>;
  dArtists: string[];
  setDArtists: Dispatch<SetStateAction<string[]>>;
  dArtistInput: string;
  setDArtistInput: Dispatch<SetStateAction<string>>;
  caPromoters: Record<string, boolean>;
  setCaPromoters: Dispatch<SetStateAction<Record<string, boolean>>>;
  caTables: Record<string, boolean>;
  setCaTables: Dispatch<SetStateAction<Record<string, boolean>>>;
  caPromoCodes: PromoCode[];
  setCaPromoCodes: Dispatch<SetStateAction<PromoCode[]>>;
  previewFrame: PreviewFrame;
  setPreviewFrame: Dispatch<SetStateAction<PreviewFrame>>;
  startCreate: () => void;
  openEdit: () => void;

  // marketing
  marketingView: MarketingView;
  setMarketingView: Dispatch<SetStateAction<MarketingView>>;
  cAudience: Audience;
  setCAudience: Dispatch<SetStateAction<Audience>>;
  cChannel: Channel;
  setCChannel: Dispatch<SetStateAction<Channel>>;
  cText: string;
  setCText: Dispatch<SetStateAction<string>>;
  composerOpen: boolean;
  setComposerOpen: Dispatch<SetStateAction<boolean>>;

  // finance
  financeView: FinanceView;
  setFinanceView: Dispatch<SetStateAction<FinanceView>>;
  ordersSearch: string;
  setOrdersSearch: Dispatch<SetStateAction<string>>;
  ordersStatus: string;
  setOrdersStatus: Dispatch<SetStateAction<string>>;
  ordersSort: OrdersSort;
  ordersSortDir: 'asc' | 'desc';
  toggleOrdersSort: (col: Exclude<OrdersSort, null>) => void;
  ordersMenuOpen: number | null;
  setOrdersMenuOpen: Dispatch<SetStateAction<number | null>>;

  // settings
  settingsView: SettingsView;
  setSettingsView: Dispatch<SetStateAction<SettingsView>>;

  goOrders: () => void;
  goBank: () => void;
}

const Ctx = createContext<VenueStudioValue | undefined>(undefined);

export function VenueStudioProvider({ children }: { readonly children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('overview');

  const [metric, setMetric] = useState<Metric>('revenue');
  const [range, setRange] = useState<Range>('1W');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calSel, setCalSel] = useState(16);
  const [calFloatOpen, setCalFloatOpen] = useState(false);
  const [calFloat, setCalFloat] = useState({ x: 420, y: 120 });

  const [eventsView, setEventsView] = useState<EventsView>('list');
  const [selectedEventIdx, setSelectedEventIdx] = useState(0);
  const [detailTab, setDetailTab] = useState<DetailTab>('sales');

  const [requestsView, setRequestsView] = useState<RequestsView>('pending');
  const [requestOverrides, setRequestOverrides] = useState<Record<number, ReqStatus>>({});

  const [audienceSeg, setAudienceSeg] = useState<AudienceSeg>('venues');
  const [venueTab, setVenueTab] = useState<'my' | 'discover'>('my');
  const [promoTab, setPromoTab] = useState<'my' | 'discover' | 'requests'>('my');

  const [createStep, setCreateStep] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [dName, setDName] = useState('');
  const [dGrad, setDGrad] = useState(0);
  const [dVenue, setDVenue] = useState(0);
  const [dDay, setDDay] = useState<number | null>(null);
  const [dArtists, setDArtists] = useState<string[]>([]);
  const [dArtistInput, setDArtistInput] = useState('');
  const [caPromoters, setCaPromoters] = useState<Record<string, boolean>>({});
  const [caTables, setCaTables] = useState<Record<string, boolean>>({});
  const [caPromoCodes, setCaPromoCodes] = useState<PromoCode[]>([
    { code: 'EARLYBIRD', type: '%', limit: '100' },
  ]);
  const [previewFrame, setPreviewFrame] = useState<PreviewFrame>(null);

  const [marketingView, setMarketingView] = useState<MarketingView>('compose');
  const [cAudience, setCAudience] = useState<Audience>('event');
  const [cChannel, setCChannel] = useState<Channel>('sms');
  const [cText, setCText] = useState(DEFAULT_COMPOSER_TEXT);
  const [composerOpen, setComposerOpen] = useState(false);

  const [financeView, setFinanceView] = useState<FinanceView>('payouts');
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatus, setOrdersStatus] = useState('All');
  const [ordersSort, setOrdersSort] = useState<OrdersSort>(null);
  const [ordersSortDir, setOrdersSortDir] = useState<'asc' | 'desc'>('desc');
  const [ordersMenuOpen, setOrdersMenuOpen] = useState<number | null>(null);

  const [settingsView, setSettingsView] = useState<SettingsView>('public');

  const go = useCallback((next: Screen) => {
    setScreen(next);
    setComposerOpen(false);
    setCalendarOpen(false);
    setNotifOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const setRequestStatus = useCallback((id: number, status: ReqStatus) => {
    setRequestOverrides((prev) => ({ ...prev, [id]: status }));
  }, []);

  const toggleOrdersSort = useCallback((col: Exclude<OrdersSort, null>) => {
    setOrdersSort((prevCol) => {
      setOrdersSortDir((prevDir) => (prevCol === col && prevDir === 'desc' ? 'asc' : 'desc'));
      return col;
    });
  }, []);

  const startCreate = useCallback(() => {
    setEditMode(false);
    setCreateStep(1);
    go('create');
  }, [go]);

  const openEdit = useCallback(() => {
    setEditMode(true);
    setDName('Neon Nights: Afrobeats Edition');
    setDGrad(0);
    setDVenue(0);
    setDDay(30);
    setCreateStep(1);
    go('create');
  }, [go]);

  const goOrders = useCallback(() => {
    setFinanceView('orders');
    go('finance');
  }, [go]);

  const goBank = useCallback(() => {
    setFinanceView('bank');
    go('finance');
  }, [go]);

  const setCalFloatPos = useCallback((pos: { x: number; y: number }) => {
    setCalFloat(pos);
  }, []);

  const value = useMemo<VenueStudioValue>(
    () => ({
      screen,
      go,
      metric,
      setMetric,
      range,
      setRange,
      searchQuery,
      setSearchQuery,
      searchFocus,
      setSearchFocus,
      notifOpen,
      setNotifOpen,
      notifRead,
      setNotifRead,
      calendarOpen,
      setCalendarOpen,
      calSel,
      setCalSel,
      calFloatOpen,
      setCalFloatOpen,
      calFloatX: calFloat.x,
      calFloatY: calFloat.y,
      setCalFloatPos,
      eventsView,
      setEventsView,
      selectedEventIdx,
      setSelectedEventIdx,
      detailTab,
      setDetailTab,
      requestsView,
      setRequestsView,
      requestOverrides,
      setRequestStatus,
      audienceSeg,
      setAudienceSeg,
      venueTab,
      setVenueTab,
      promoTab,
      setPromoTab,
      createStep,
      setCreateStep,
      editMode,
      setEditMode,
      dName,
      setDName,
      dGrad,
      setDGrad,
      dVenue,
      setDVenue,
      dDay,
      setDDay,
      dArtists,
      setDArtists,
      dArtistInput,
      setDArtistInput,
      caPromoters,
      setCaPromoters,
      caTables,
      setCaTables,
      caPromoCodes,
      setCaPromoCodes,
      previewFrame,
      setPreviewFrame,
      startCreate,
      openEdit,
      marketingView,
      setMarketingView,
      cAudience,
      setCAudience,
      cChannel,
      setCChannel,
      cText,
      setCText,
      composerOpen,
      setComposerOpen,
      financeView,
      setFinanceView,
      ordersSearch,
      setOrdersSearch,
      ordersStatus,
      setOrdersStatus,
      ordersSort,
      ordersSortDir,
      toggleOrdersSort,
      ordersMenuOpen,
      setOrdersMenuOpen,
      settingsView,
      setSettingsView,
      goOrders,
      goBank,
    }),
    [
      screen,
      go,
      metric,
      range,
      searchQuery,
      searchFocus,
      notifOpen,
      notifRead,
      calendarOpen,
      calSel,
      calFloatOpen,
      calFloat.x,
      calFloat.y,
      setCalFloatPos,
      eventsView,
      selectedEventIdx,
      detailTab,
      requestsView,
      requestOverrides,
      setRequestStatus,
      audienceSeg,
      venueTab,
      promoTab,
      createStep,
      editMode,
      dName,
      dGrad,
      dVenue,
      dDay,
      dArtists,
      dArtistInput,
      caPromoters,
      caTables,
      caPromoCodes,
      previewFrame,
      startCreate,
      openEdit,
      marketingView,
      cAudience,
      cChannel,
      cText,
      composerOpen,
      financeView,
      ordersSearch,
      ordersStatus,
      ordersSort,
      ordersSortDir,
      toggleOrdersSort,
      ordersMenuOpen,
      settingsView,
      goOrders,
      goBank,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVenueStudio(): VenueStudioValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useVenueStudio must be used within VenueStudioProvider');
  return ctx;
}
