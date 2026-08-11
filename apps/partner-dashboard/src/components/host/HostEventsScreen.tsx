import Image from 'next/image';
import Link from 'next/link';

import { hostEvents, hostSlotRequests } from './host-studio-model';
import { HostButton, HostHeader, HostPage, HostStatus, HostTable, HostTabs } from './HostStudioUi';

const toneFor = (status: string) =>
  status === 'Live' || status === 'Accepted'
    ? ('success' as const)
    : status === 'Invitation' || status === 'Pending' || status === 'Needs changes'
      ? ('warning' as const)
      : ('neutral' as const);

export function HostEventsScreen({ tab = 'upcoming' }: { readonly tab?: string }) {
  const tabs = [
    { label: 'Upcoming', value: 'upcoming', href: '/host/events?tab=upcoming' },
    { label: 'Live', value: 'live', href: '/host/events?tab=live' },
    { label: 'Invitations', value: 'invitations', href: '/host/events/invitations' },
    { label: 'Slot requests', value: 'requests', href: '/host/events?tab=requests' },
    { label: 'Past', value: 'past', href: '/host/events?tab=past' },
  ];
  const filtered =
    tab === 'live'
      ? hostEvents.filter((item) => item.status === 'Live')
      : tab === 'past'
        ? hostEvents.filter((item) => item.status === 'Completed')
        : hostEvents.filter((item) =>
            ['Upcoming', 'Requested', 'Invitation'].includes(item.status),
          );
  return (
    <HostPage>
      <HostHeader
        title="Events"
        description="Dates you host, invitations, and venue slot requests."
        action={
          <HostButton href="/host/events/create" primary>
            Start event request
          </HostButton>
        }
      />
      <HostTabs items={tabs} active={tab} />
      {tab === 'requests' ? (
        <HostTable
          columns={['Request', 'Venue', 'Date', 'Updated', 'Status', '']}
          label="Slot requests"
        >
          <>
            {hostSlotRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.eventName}</strong>
                  <small>{request.id}</small>
                </td>
                <td>{request.venue}</td>
                <td>
                  {request.date}
                  <small>{request.time}</small>
                </td>
                <td>{request.updatedAt}</td>
                <td>
                  <HostStatus tone={toneFor(request.status)}>{request.status}</HostStatus>
                </td>
                <td>
                  <Link href={`/host/events/requests/${request.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </>
        </HostTable>
      ) : (
        <HostTable columns={['Event', 'Venue', 'Date', 'Guests', 'Status', '']} label="Host events">
          <>
            {filtered.map((event) => (
              <tr key={event.id}>
                <td>
                  <div className="host-table-person">
                    <Image src={event.poster} width={48} height={48} alt="" />
                    <strong>{event.name}</strong>
                  </div>
                </td>
                <td>
                  {event.venue}
                  <small>{event.city}</small>
                </td>
                <td>
                  {event.date}
                  <small>{event.time}</small>
                </td>
                <td>
                  {event.confirmed === null
                    ? 'Unavailable'
                    : `${String(event.confirmed)} confirmed`}
                </td>
                <td>
                  <HostStatus tone={toneFor(event.status)}>{event.status}</HostStatus>
                </td>
                <td>
                  <Link href={`/host/events/${event.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </>
        </HostTable>
      )}
    </HostPage>
  );
}

export function HostInvitationsScreen() {
  const invitations = hostEvents.filter((event) => event.status === 'Invitation');
  return (
    <HostPage>
      <HostHeader
        title="Event invitations"
        description="Review venue invitations and respond before their deadline."
      />
      <HostTabs
        active="invitations"
        items={[
          { label: 'Upcoming', value: 'upcoming', href: '/host/events' },
          { label: 'Invitations', value: 'invitations', href: '/host/events/invitations' },
          { label: 'Slot requests', value: 'requests', href: '/host/events?tab=requests' },
        ]}
      />
      <div className="host-card-list">
        {invitations.map((event) => (
          <article key={event.id}>
            <Image src={event.poster} width={72} height={72} alt="" />
            <div>
              <HostStatus tone="warning">Response due tomorrow</HostStatus>
              <h2>{event.name}</h2>
              <p>
                {event.venue} · {event.date} · {event.time}
              </p>
            </div>
            <HostButton href="/host/events/invitations/invite-neon">Review</HostButton>
            <HostButton
              disabled
              title="Invitation decline is unavailable until the invitation mutation is connected"
            >
              Decline
            </HostButton>
          </article>
        ))}
      </div>
    </HostPage>
  );
}
