'use client';

import { css } from './charts';
import { EVENTS } from './data';
import { CalendarModal } from './modals/CalendarModal';
import { ComposerModal } from './modals/ComposerModal';
import { FloatingCalendar } from './modals/FloatingCalendar';
import { CreateEventScreen } from './screens/CreateEventScreen';
import { DoorModeScreen } from './screens/DoorModeScreen';
import { EventDetailScreen } from './screens/EventDetailScreen';
import { EventsScreen } from './screens/EventsScreen';
import { FinanceScreen } from './screens/FinanceScreen';
import { MarketingScreen } from './screens/MarketingScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { PartnersScreen } from './screens/PartnersScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SlotRequestsScreen } from './screens/SlotRequestsScreen';
import { VenueStudioProvider, useVenueStudio } from './store';
import { TopBar } from './TopBar';

export interface VenueStudioProps {
  /** Avatar initials shown in the topbar — derived from the signed-in profile. */
  readonly initials: string;
  /** Partner/venue name, surfaced as the avatar tooltip. */
  readonly venueName: string;
}

export function VenueStudio(props: VenueStudioProps) {
  return (
    <VenueStudioProvider>
      <VenueStudioShell {...props} />
    </VenueStudioProvider>
  );
}

function VenueStudioShell({ initials, venueName }: VenueStudioProps) {
  const s = useVenueStudio();
  const selectedEvent = EVENTS[s.selectedEventIdx];
  const selectedEventId = selectedEvent?.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') ?? 'event';

  return (
    <div className="venue-studio" style={css('min-height:100vh;width:100%;position:relative;')}>
      <div
        role="presentation"
        onClick={() => {
          s.setNotifOpen(false);
        }}
        style={css('position:relative;z-index:1;')}
      >
        <TopBar initials={initials} venueName={venueName} />

        <div style={css('max-width:1440px;margin:0 auto;padding:28px 28px 80px;')}>
          {s.screen === 'overview' ? <OverviewScreen /> : null}
          {s.screen === 'events' ? <EventsScreen /> : null}
          {s.screen === 'slotRequests' ? <SlotRequestsScreen /> : null}
          {s.screen === 'eventDetail' ? <EventDetailScreen eventId={selectedEventId} /> : null}
          {s.screen === 'audience' ? <PartnersScreen /> : null}
          {s.screen === 'create' ? <CreateEventScreen /> : null}
          {s.screen === 'marketing' ? <MarketingScreen /> : null}
          {s.screen === 'finance' ? <FinanceScreen /> : null}
          {s.screen === 'door' ? <DoorModeScreen /> : null}
          {s.screen === 'settings' ? <SettingsScreen /> : null}
        </div>

        <CalendarModal />
        <ComposerModal />
      </div>

      <FloatingCalendar />
    </div>
  );
}
