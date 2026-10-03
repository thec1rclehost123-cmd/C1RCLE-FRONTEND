/*
 * Bell chime for newly-arrived notifications, synthesized with the Web Audio
 * API so no binary asset ships. Browsers block audio before a user gesture;
 * every callback path here fails softly (a document that is hidden or has not
 * granted audio yet simply stays silent and the error is swallowed — the
 * unread badge remains the source of truth for missed chimes).
 */
let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  if (audioContext === null) {
    // The standard `AudioContext` global is typed non-nullable, so gate at
    // runtime with `typeof` for environments (old WebKit, jsdom) that lack it.
    if (typeof AudioContext !== 'function') {
      return null;
    }
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume();
  }
  return audioContext;
}

export async function playNotificationChime(): Promise<void> {
  const ctx = context();
  if (ctx === null || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
    return;
  }

  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(988, now);
  oscillator.frequency.exponentialRampToValueAtTime(1319, now + 0.09);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.45);

  await new Promise<void>((resolve) => {
    oscillator.onended = () => {
      resolve();
    };
  });
}
