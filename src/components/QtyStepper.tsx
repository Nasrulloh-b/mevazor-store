interface Props {
  value: number;
  max: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
  id?: string;
}

export function QtyStepper({ value, max, onChange, min = 1, label, id }: Props) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="−1">
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(Math.max(n, min), Math.max(max, min)));
        }}
      />
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="+1">
        +
      </button>
    </div>
  );
}
