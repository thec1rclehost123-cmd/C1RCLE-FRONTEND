import Link from 'next/link';

import { promoterNotifications } from '@/components/promoter/promoter-studio-model';
import { PromoterPageHeader } from '@/components/promoter/PromoterStudioUi';

export default function NotificationCenterPage() {
  return (
    <div className="pr-page">
      <PromoterPageHeader
        eyebrow="Inbox"
        title="Notifications"
        description="Invitations, link milestones and finance updates for Club Zing."
      />
      <section className="pr-notification-list pr-glass-panel">
        {promoterNotifications.map((item) => (
          <Link key={item.id} href={item.destination}>
            <span className="pr-notification-dot" />
            <div>
              <strong>{item.title}</strong>
              <p>{item.summary}</p>
            </div>
            <time>{item.time}</time>
            <span aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
