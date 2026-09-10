'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
}

export function MagneticButton({
  children,
  className = '',
  href,
  onClick,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const springX = useSpring(motionX, { stiffness: 150, damping: 15, mass: 0.1 });
  const springY = useSpring(motionY, { stiffness: 150, damping: 15, mass: 0.1 });

  useEffect(() => {
    const button = buttonRef.current;
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!button || !supportsHover || reduceMotion) return;

    const handleMouseMove = (e: Event) => {
      const me = e as MouseEvent;
      const rect = button.getBoundingClientRect();
      const x = me.clientX - rect.left - rect.width / 2;
      const y = me.clientY - rect.top - rect.height / 2;

      // Only apply magnetic effect if cursor is within 100px
      const distance = Math.sqrt(x * x + y * y);
      if (distance < 100) {
        motionX.set(x * 0.3);
        motionY.set(y * 0.3);
      }
    };

    const handleMouseLeave = () => {
      motionX.set(0);
      motionY.set(0);
    };

    button.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      button.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [motionX, motionY]);

  // The union of motion.a | motion.button accepts different ref/attr shapes,
  // so declaring the intrinsic type keeps every attribute type-checked without
  // a forced cast.
  const Component: React.ElementType = href ? motion.a : motion.button;

  return (
    <Component
      ref={buttonRef}
      href={href}
      onClick={onClick}
      className={`cursor-pointer ${className}`}
      // eslint-disable-next-line no-restricted-syntax -- framer-motion transform deltas (x/y) are spring motion values, not CSS; they are not expressible as Tailwind utilities and must be applied via the style prop.
      style={{ x: springX, y: springY }}
    >
      {children}
    </Component>
  );
}
