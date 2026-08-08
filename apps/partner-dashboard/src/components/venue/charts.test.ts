import { describe, expect, it } from 'vitest';

import { buildPaths, calCells, css, num } from './charts';

describe('num', () => {
  it('stringifies without locale formatting', () => {
    expect(num(1234.5)).toBe('1234.5');
    expect(num(0)).toBe('0');
    expect(num(-12)).toBe('-12');
  });
});

describe('buildPaths', () => {
  it('starts the line at the first point and closes the area to the baseline', () => {
    const { line, area } = buildPaths([1, 2, 3]);
    expect(line.startsWith('M ')).toBe(true);
    // Area re-uses the line then closes down to y=190 (the viewBox floor).
    expect(area.startsWith(line)).toBe(true);
    expect(area.endsWith('L 600 190 L 0 190 Z')).toBe(true);
  });

  it('emits one cubic segment per gap between points', () => {
    const { line } = buildPaths([5, 10, 4, 8]);
    expect(line.match(/C /g)).toHaveLength(3);
  });

  it('survives a flat series without dividing by zero', () => {
    const { line } = buildPaths([7, 7, 7]);
    expect(line).not.toContain('NaN');
  });

  it('never emits NaN for a single-value series', () => {
    // n - 1 === 0 makes the x-step a division by zero.
    const { line, area } = buildPaths([42]);
    expect(line).not.toContain('NaN');
    expect(area).not.toContain('NaN');
  });
});

describe('calCells', () => {
  it('pads the leading offset then emits one cell per day', () => {
    const cells = calCells({ days: 31, offset: 3 });
    expect(cells).toHaveLength(34);
    expect(cells.slice(0, 3).every((c) => c.empty)).toBe(true);
    expect(cells[3]?.label).toBe('1');
    expect(cells.at(-1)?.label).toBe('31');
  });

  it('marks the selected day and hides its status dot', () => {
    const cells = calCells({ days: 30, offset: 0, selected: 5, statusMap: { 5: 'confirmed' } });
    const selected = cells.find((c) => c.day === 5);
    expect(selected?.style).toContain('#ff5a1f');
    // Selected cells drop the dot — the fill already conveys the state.
    expect(selected?.dotStyle).toBe('display:none;');
  });

  it('gives an unselected status day a coloured dot', () => {
    const cells = calCells({ days: 30, offset: 0, statusMap: { 9: 'pending' } });
    expect(cells.find((c) => c.day === 9)?.dotStyle).toContain('#ffb020');
  });
});

describe('css', () => {
  it('converts kebab-case declarations to a React style object', () => {
    expect(css('background-color:#fff;font-size:12px;')).toEqual({
      backgroundColor: '#fff',
      fontSize: '12px',
    });
  });

  it('preserves custom properties verbatim', () => {
    expect(css('--v-r-full:999px;')).toEqual({ '--v-r-full': '999px' });
  });

  it('keeps values containing colons intact', () => {
    expect(css('background:url(http://x/y.png);')).toEqual({
      background: 'url(http://x/y.png)',
    });
  });

  it('ignores empty and malformed declarations', () => {
    expect(css(';;color:red;garbage;')).toEqual({ color: 'red' });
  });
});
