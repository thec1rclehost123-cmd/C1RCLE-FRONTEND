'use client';

export interface StatusFilterOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
}

export function StatusFilter<TValue extends string>({
  options,
  value,
  onChange,
  id,
}: {
  readonly options: readonly StatusFilterOption<TValue>[];
  readonly value: TValue;
  readonly onChange: (value: TValue) => void;
  readonly id: string;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-muted-foreground">
      Status
      <select
        id={id}
        value={value}
        onChange={(event) => { onChange(event.target.value as TValue); }}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}