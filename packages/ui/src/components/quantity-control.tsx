import { Button } from './button.js';

export interface QuantityControlProps {
  readonly label: string;
  readonly value: number;
  readonly min?: number;
  readonly max: number;
  readonly disabled?: boolean;
  readonly onChange: (value: number) => void;
}

export function QuantityControl({
  label,
  value,
  min = 0,
  max,
  disabled = false,
  onChange,
}: QuantityControlProps) {
  return (
    <div className="inline-flex min-h-11 items-center gap-2" role="group" aria-label={label}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Decrease ${label}`}
        disabled={disabled || value <= min}
        onClick={() => {
          onChange(Math.max(min, value - 1));
        }}
      >
        −
      </Button>
      <output className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
        {value}
      </output>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label={`Increase ${label}`}
        disabled={disabled || value >= max}
        onClick={() => {
          onChange(Math.min(max, value + 1));
        }}
      >
        +
      </Button>
    </div>
  );
}
