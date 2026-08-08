/**
 * Chart + calendar geometry helpers.
 *
 * Ported 1:1 from the `buildPaths` / `calCells` methods in the C1RCLE Dashboard
 * mockup so the curves and month grids render identically.
 */

export interface ChartPaths {
  line: string;
  area: string;
}

/**
 * Stringifies a number for interpolation into a CSS/SVG string.
 *
 * The lint config bans implicit number coercion inside template literals, and
 * these style strings are built from numeric geometry throughout.
 */
export const num = (v: number): string => String(v);

/**
 * Builds a smoothed (mid-point cubic) line + filled area path across a fixed
 * 600×190 viewBox. Values are normalised to their own min/max.
 */
export function buildPaths(values: readonly number[]): ChartPaths {
  const W = 600;
  const H = 190;
  const pad = 8;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const n = values.length;

  const pts: [number, number][] = values.map((v, i) => {
    // A single-point series would make this 0/0; pin that lone point to x=0.
    const x = n > 1 ? (i / (n - 1)) * W : 0;
    const y = H - pad - ((v - min) / span) * (H - pad * 2 - 20);
    return [x, y];
  });

  const first = pts[0] ?? [0, H];
  let line = `M ${num(first[0])} ${num(first[1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    if (!p0 || !p1) continue;
    const [x0, y0] = p0;
    const [x1, y1] = p1;
    const cx = (x0 + x1) / 2;
    line += ` C ${num(cx)} ${num(y0)}, ${num(cx)} ${num(y1)}, ${num(x1)} ${num(y1)}`;
  }

  return { line, area: `${line} L ${num(W)} ${num(H)} L 0 ${num(H)} Z` };
}

export type DayStatus = 'confirmed' | 'pending' | 'blocked';

export interface CalCell {
  empty: boolean;
  label: string;
  day: number;
  style: string;
  dotStyle: string;
  disabled: boolean;
}

const STATUS_RING: Record<DayStatus, string> = {
  confirmed: 'rgba(110,231,155,0.55)',
  pending: 'rgba(255,176,32,0.55)',
  blocked: 'rgba(240,133,122,0.55)',
};

export const STATUS_DOT: Record<DayStatus, string> = {
  confirmed: '#6ee79b',
  pending: '#ffb020',
  blocked: '#f0857a',
};

export interface CalCellsConfig {
  days: number;
  offset: number;
  statusMap?: Partial<Record<number, DayStatus>>;
  selected?: number | null;
  cellH?: number;
}

/** Builds a month grid of day cells with status ring / dot styling. */
export function calCells(cfg: CalCellsConfig): CalCell[] {
  const { days, offset, statusMap = {}, selected = null, cellH = 56 } = cfg;
  const cells: CalCell[] = [];

  for (let i = 0; i < offset; i++) {
    cells.push({
      empty: true,
      label: '',
      day: 0,
      style: `height:${num(cellH)}px;`,
      dotStyle: 'display:none;',
      disabled: true,
    });
  }

  for (let d = 1; d <= days; d++) {
    const st = statusMap[d];
    const isSel = selected === d;

    let base =
      `position:relative;height:${num(cellH)}px;display:flex;flex-direction:column;` +
      `align-items:center;justify-content:center;border-radius:16px;font-size:15px;` +
      `font-weight:700;font-variant-numeric:tabular-nums;transition:all .12s;cursor:pointer;`;

    if (isSel) {
      base += 'background:#ff5a1f;color:#0a0a0a;box-shadow:0 8px 22px rgba(255,90,31,0.4);';
    } else if (st) {
      base += `background:rgba(255,255,255,0.03);color:#f5f5f3;border:1px solid ${STATUS_RING[st]};`;
    } else {
      base +=
        'background:rgba(255,255,255,0.02);color:#c9c9c6;border:1px solid rgba(255,255,255,0.05);';
    }

    cells.push({
      empty: false,
      label: String(d),
      day: d,
      style: base,
      dotStyle:
        st && !isSel
          ? `position:absolute;bottom:9px;width:6px;height:6px;border-radius:50%;background:${STATUS_DOT[st]};`
          : 'display:none;',
      disabled: false,
    });
  }

  return cells;
}

/**
 * Parses the mockup's inline CSS-text strings into a React style object so the
 * ported style helpers can stay as single-source-of-truth strings.
 */
export function css(styleText: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of styleText.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    const camel = prop.startsWith('--')
      ? prop
      : prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = value;
  }
  return out;
}
