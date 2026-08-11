'use client';

import { useMemo, useState } from 'react';

type ComposerErrors = Readonly<Partial<Record<'name' | 'venue' | 'date' | 'start' | 'end' | 'capacity' | 'price', string>>>;

const timeValue = (date: string, time: string): number => Date.parse(`${date}T${time}:00`);

export function HostEventComposer() {
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('19:30');
  const [end, setEnd] = useState('23:30');
  const [capacity, setCapacity] = useState('250');
  const [price, setPrice] = useState('800');
  const [submitted, setSubmitted] = useState(false);
  const [validationClock] = useState(() => Date.now());

  const errors = useMemo<ComposerErrors>(() => {
    const next: Partial<Record<keyof ComposerErrors, string>> = {};
    if (name.trim().length < 3) next.name = 'Use at least 3 characters.';
    if (!venue.trim()) next.venue = 'Choose or enter a venue.';
    if (!date) next.date = 'Select an event date.';
    if (date && timeValue(date, start) <= validationClock) next.date = 'The event must start in the future.';
    if (date && start && end && timeValue(date, end) <= timeValue(date, start)) next.end = 'End time must be after start time.';
    if (!Number.isFinite(Number(capacity)) || Number(capacity) < 1 || Number(capacity) > 20_000) next.capacity = 'Capacity must be between 1 and 20,000.';
    if (!Number.isFinite(Number(price)) || Number(price) < 0) next.price = 'Price cannot be negative.';
    return next;
  }, [capacity, date, end, name, price, start, validationClock, venue]);

  const valid = Object.keys(errors).length === 0;
  const fieldError = (key: keyof ComposerErrors) => submitted ? errors[key] : undefined;

  return (
    <form className="host-composer pd-surface" noValidate onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
      <div className="host-composer-progress" aria-label="Event creation progress"><span className="is-active">1</span><i /><span>2</span><i /><span>3</span></div>
      <section><span>Event identity</span><h2>Give the room a clear identity.</h2><div className="host-form-grid">
        <label className="is-wide"><span>Event name</span><input value={name} onChange={(event) => { setName(event.target.value); setSubmitted(false); }} aria-invalid={Boolean(fieldError('name'))} />{fieldError('name') ? <small>{fieldError('name')}</small> : null}</label>
        <label><span>Venue</span><input value={venue} onChange={(event) => { setVenue(event.target.value); setSubmitted(false); }} placeholder="Skyline Social" aria-invalid={Boolean(fieldError('venue'))} />{fieldError('venue') ? <small>{fieldError('venue')}</small> : null}</label>
        <label><span>Category</span><select defaultValue="Live music"><option>Live music</option><option>Electronic</option><option>Culture</option><option>Food & drink</option></select></label>
      </div></section>
      <section><span>Schedule</span><h2>Set the date and operating window.</h2><div className="host-form-grid host-form-grid--three">
        <label><span>Date</span><input type="date" value={date} onChange={(event) => { setDate(event.target.value); setSubmitted(false); }} aria-invalid={Boolean(fieldError('date'))} />{fieldError('date') ? <small>{fieldError('date')}</small> : null}</label>
        <label><span>Starts</span><input type="time" value={start} onChange={(event) => { setStart(event.target.value); setSubmitted(false); }} /></label>
        <label><span>Ends</span><input type="time" value={end} onChange={(event) => { setEnd(event.target.value); setSubmitted(false); }} aria-invalid={Boolean(fieldError('end'))} />{fieldError('end') ? <small>{fieldError('end')}</small> : null}</label>
      </div></section>
      <section><span>Admission</span><h2>Set inventory and starting price.</h2><div className="host-form-grid">
        <label><span>Capacity</span><input inputMode="numeric" value={capacity} onChange={(event) => { setCapacity(event.target.value); setSubmitted(false); }} aria-invalid={Boolean(fieldError('capacity'))} />{fieldError('capacity') ? <small>{fieldError('capacity')}</small> : null}</label>
        <label><span>Starting price (₹)</span><input inputMode="numeric" value={price} onChange={(event) => { setPrice(event.target.value); setSubmitted(false); }} aria-invalid={Boolean(fieldError('price'))} />{fieldError('price') ? <small>{fieldError('price')}</small> : null}</label>
      </div></section>
      <footer><div><strong>{valid ? 'Ready for review' : 'Complete the required fields'}</strong><small>No event is created until the backend publishing workflow confirms it.</small></div><button type="submit">Review event</button></footer>
      {submitted && valid ? <div className="host-composer-success" role="status"><strong>Event request ready.</strong><span>The typed payload is valid and ready for the publishing API.</span></div> : null}
    </form>
  );
}
