import { render } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { HomePhoneMockup } from './HomePhoneMockup';

describe('HomePhoneMockup screen positioning', () => {
  it('starts each screen at its animated horizontal slot without a competing CSS translate', () => {
    const phoneRef = createRef<HTMLDivElement>();
    const screenRefs = Array.from({ length: 6 }, () => createRef<HTMLDivElement>());

    render(
      <HomePhoneMockup
        phoneRef={phoneRef}
        screen1Ref={screenRefs[0]!}
        screen2Ref={screenRefs[1]!}
        screen3Ref={screenRefs[2]!}
        screen4Ref={screenRefs[3]!}
        screen5Ref={screenRefs[4]!}
        screen6Ref={screenRefs[5]!}
        activeScreen={0}
      />,
    );

    expect(
      screenRefs.map((ref) =>
        ref.current?.classList.contains(`story-screen-slot-${String(screenRefs.indexOf(ref))}`),
      ),
    ).toEqual([true, true, true, true, true, true]);
    expect(screenRefs.every((ref) => !ref.current?.classList.contains('translate-x-full'))).toBe(
      true,
    );
  });
});
