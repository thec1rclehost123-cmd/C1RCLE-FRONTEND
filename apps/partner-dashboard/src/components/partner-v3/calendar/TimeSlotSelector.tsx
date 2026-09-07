import styles from './calendar.module.css';

import type { AvailabilitySlot } from '@/data/partner-data-source';

export function TimeSlotSelector({ slots, selectedSlotId, onSelect }: { readonly slots: readonly AvailabilitySlot[]; readonly selectedSlotId?: string | undefined; readonly onSelect: (slot: AvailabilitySlot) => void }) {
  if (!slots.length) return <p className={styles['slotEmpty']}>No open time slots are available for this date.</p>;
  return <fieldset className={styles['slotSelector']}><legend>Available time slots</legend><div>{slots.map((slot) => <button type="button" disabled={slot.status !== 'available'} aria-pressed={slot.id === selectedSlotId} className={slot.id === selectedSlotId ? styles['slotSelected'] : ''} onClick={() => { onSelect(slot); }} key={slot.id}>{slot.label}</button>)}</div></fieldset>;
}
