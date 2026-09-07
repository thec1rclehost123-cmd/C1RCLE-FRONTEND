import styles from './VenueEventDetail.module.css';

const chartWidth = 650;
const chartHeight = 210;

const point = (value: number, index: number, count: number, maximum: number) => ({
  x: (index / Math.max(count - 1, 1)) * chartWidth,
  y: chartHeight - (Math.min(value, maximum) / Math.max(maximum, 1)) * chartHeight,
});

const pathFor = (values: readonly number[], maximum: number): string =>
  values
    .map((value, index) => {
      const position = point(value, index, values.length, maximum);
      return `${index === 0 ? 'M' : 'L'} ${position.x.toFixed(2)} ${position.y.toFixed(2)}`;
    })
    .join(' ');

export function EventLineChart({
  values,
  labels,
  yLabels,
  maximum,
  accessibleSummary,
  valueLabel,
}: {
  readonly values: readonly number[];
  readonly labels: readonly string[];
  readonly yLabels: readonly string[];
  readonly maximum: number;
  readonly accessibleSummary: string;
  readonly valueLabel: (value: number) => string;
}) {
  return (
    <div className={styles['chart']}>
      <div className={styles['yLabels']} aria-hidden="true">
        {yLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${String(chartWidth)} ${String(chartHeight)}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={accessibleSummary}
      >
        <g className={styles['gridLines']} aria-hidden="true">
          <line x1="0" y1="0" x2={chartWidth} y2="0" />
          <line x1="0" y1="70" x2={chartWidth} y2="70" />
          <line x1="0" y1="140" x2={chartWidth} y2="140" />
          <line x1="0" y1="210" x2={chartWidth} y2="210" />
        </g>
        <path className={styles['chartLine']} d={pathFor(values, maximum)} />
        {values.map((value, index) => {
          const position = point(value, index, values.length, maximum);
          return (
            <circle key={`${String(index)}-${String(value)}`} cx={position.x} cy={position.y} r="5">
              <title>{`${labels[index] ?? ''}: ${valueLabel(value)}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className={styles['xLabels']} aria-hidden="true">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
