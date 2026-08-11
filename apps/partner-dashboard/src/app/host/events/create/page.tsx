import { HostEventComposer } from '@/components/host/HostEventComposer';
import { DashboardButton, DashboardPageHeader } from '@/components/partner-shell/DashboardUi';

export default function HostCreateEventPage() {
  return <><DashboardPageHeader eyebrow="Create event" title="Build the next room." description="A fast, validated event draft that is ready for the backend publishing workflow." actions={<DashboardButton href="/host/events">Cancel</DashboardButton>} /><HostEventComposer /></>;
}
