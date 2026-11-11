'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { EventCardArtwork } from '@/features/explore/components/EventCardArtwork';

import styles from './HomeFeaturedEvents.module.css';

import type { ExploreEvent } from '@/features/explore/types/explore.types';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
  timeZone: 'Asia/Kolkata',
});

export function HomeFeaturedEventsCarousel({ events }: { events: readonly ExploreEvent[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const progressRef = useRef(0);
  const [copyCount, setCopyCount] = useState(3);
  const canAnimate = events.length >= 2;
  const copies = canAnimate ? Array.from({ length: copyCount }, (_, index) => index) : [1];

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !canAnimate) return;
    if (typeof window.matchMedia !== 'function') {
      delete stage.dataset['animated'];
      stage.style.removeProperty('height');
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.removeAttribute('style');
        const duplicate = card.dataset['duplicate'] === 'true';
        card.inert = duplicate;
        card.setAttribute('aria-hidden', String(duplicate));
      });
      return;
    }
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let interacting = false;
    let frame = 0;
    let previousTime: number | null = null;

    const positionCards = () => {
      const width = stage.clientWidth;
      const mobile = width < 768;
      const cardWidth = Math.min(Math.max(width * (mobile ? 0.44 : 0.24), 130), 330);
      const cardHeight = Math.round(cardWidth * 1.42);
      const radius = Math.max(width * (mobile ? 0.54 : 0.48), cardWidth * (mobile ? 1.7 : 1.95));
      const stageHeight = Math.round(cardHeight * (mobile ? 1.48 : 1.6));
      const requiredCopies = Math.max(
        3,
        Math.ceil(
          (Math.ceil((width + 2 * cardWidth) / cardWidth) + 2 * events.length) / events.length,
        ),
      );
      if (requiredCopies !== copyCount) setCopyCount(requiredCopies);
      const centerIndex = Math.floor((events.length * copyCount) / 2);
      const maxAngle = Math.PI * 0.58;
      stage.style.height = `${String(stageHeight)}px`;
      // Progress is measured in card widths, preserving position across resize.
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const rawAngle = ((index - centerIndex - progressRef.current) * cardWidth) / radius;
        const angle = Math.max(-maxAngle, Math.min(maxAngle, rawAngle));
        const prominence = Math.max(0, Math.min(1, 1 - Math.abs(angle) / (maxAngle * 0.96)));
        const hidden =
          Math.abs(rawAngle) > maxAngle ||
          Math.abs(index - centerIndex - progressRef.current) > events.length / 2;
        card.inert = hidden;
        card.setAttribute('aria-hidden', String(hidden));
        card.style.width = `${String(cardWidth)}px`;
        card.style.height = `${String(cardHeight)}px`;
        card.style.marginLeft = `${String(-cardWidth / 2)}px`;
        card.style.marginTop = `${String(-cardHeight / 2)}px`;
        card.style.top = mobile ? '43%' : '40%';
        card.style.opacity = String(0.2 + prominence * 0.8);
        card.style.zIndex = String(Math.round(120 + prominence * 180));
        card.style.boxShadow = `0 30px 80px rgba(0, 0, 0, ${String(0.1 + prominence * 0.24)})`;
        card.style.setProperty('--poster-scale', String(1.08 - prominence * 0.06));
        card.style.transform = `translateX(${String(Math.sin(angle) * radius)}px) translateY(${String((1 - Math.cos(angle)) * cardHeight * 0.32)}px) translateZ(${String((Math.cos(angle) - 1) * radius * 1.25)}px) rotateY(${String((-angle * 180) / Math.PI)}deg) rotateZ(${String(Math.max(-4.5, Math.min(4.5, ((angle * 180) / Math.PI) * 0.08)))}deg)`;
      });
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = null;
    };
    const tick = (time: number) => {
      if (previousTime !== null) {
        // Match the deployed carousel's constant 42 CSS pixels per second.
        const width = stage.clientWidth;
        const cardWidth = Math.min(Math.max(width * (width < 768 ? 0.44 : 0.24), 130), 330);
        progressRef.current =
          (progressRef.current + ((time - previousTime) * 42) / 1000 / cardWidth) % events.length;
      }
      previousTime = time;
      positionCards();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      stop();
      if (motion.matches) {
        delete stage.dataset['animated'];
        stage.style.removeProperty('height');
        cardRefs.current.forEach((card) => {
          if (!card) return;
          card.removeAttribute('style');
          const duplicate = card.dataset['duplicate'] === 'true';
          card.inert = duplicate;
          card.setAttribute('aria-hidden', String(duplicate));
        });
        return;
      }
      stage.dataset['animated'] = 'true';
      positionCards();
      if (visible && !interacting && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const enter = () => {
      interacting = true;
      sync();
    };
    const leave = () => {
      interacting = stage.matches(':focus-within');
      sync();
    };
    const focusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && stage.contains(event.relatedTarget)) return;
      interacting = stage.matches(':hover');
      sync();
    };
    const resize = new ResizeObserver(() => {
      if (!motion.matches) positionCards();
    });
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    resize.observe(stage);
    visibility.observe(stage);
    stage.addEventListener('mouseenter', enter);
    stage.addEventListener('mouseleave', leave);
    stage.addEventListener('focusin', enter);
    stage.addEventListener('focusout', focusOut);
    motion.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      stop();
      resize.disconnect();
      visibility.disconnect();
      stage.removeEventListener('mouseenter', enter);
      stage.removeEventListener('mouseleave', leave);
      stage.removeEventListener('focusin', enter);
      stage.removeEventListener('focusout', focusOut);
      motion.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [events.length, canAnimate, copyCount]);

  return (
    <>
      <div
        ref={stageRef}
        className={styles['stage']}
        role="region"
        aria-label="Featured events carousel"
      >
        {copies.flatMap((copy) =>
          events.map((event, index) => (
            <Link
              key={`${String(copy)}-${event.id}`}
              data-duplicate={canAnimate && copy !== Math.floor(copyCount / 2)}
              ref={(node) => {
                cardRefs.current[(canAnimate ? copy * events.length : 0) + index] = node;
              }}
              href={`/event/${event.slug}`}
              className={styles['card']}
              aria-label={`View ${event.title}. ${dateFormatter.format(new Date(event.startsAt))}. ${event.venue}, ${event.city}.`}
            >
              <EventCardArtwork
                src={event.image}
                title={event.title}
                startsAt={event.startsAt}
                category={event.category}
                detailsOverlay
              />
              <div className={styles['shade']} aria-hidden="true" />
              <span className={styles['date']}>
                {dateFormatter.format(new Date(event.startsAt))}
              </span>
              <div className={styles['details']}>
                <p className={styles['venue']}>{event.venue || event.city}</p>
                <h3>{event.title}</h3>
                <div className={styles['cardFooter']}>
                  <span>Featured event</span>
                  <span>Enter ↗</span>
                </div>
              </div>
            </Link>
          )),
        )}
      </div>
    </>
  );
}
