interface StatProps {
  label: string;
  value: string | number;
  hint?: string;
}

export function Stat({ label, value, hint }: StatProps): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="font-display leading-none tabular-nums text-text"
        style={{ fontSize: 'var(--text-2xl)' }}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-widest text-text-muted">{label}</span>
      {hint ? <span className="text-xs text-text-faint">{hint}</span> : null}
    </div>
  );
}
