import { type KeyboardEvent, useCallback, useRef } from 'react';

interface Tab<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (next: T) => void;
  tabs: Array<Tab<T>>;
  ariaLabel?: string;
}

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  ariaLabel,
}: TabsProps<T>): JSX.Element {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKey = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (index + delta + tabs.length) % tabs.length;
      const next = tabs[nextIndex];
      if (!next) return;
      onChange(next.id);
      refs.current[nextIndex]?.focus();
    },
    [tabs, onChange],
  );

  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-6">
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKey(event, index)}
            className={`relative pb-1 text-xs uppercase tracking-widest transition-colors duration-150 focus:outline-none ${
              selected ? 'text-text' : 'text-text-muted hover:text-text'
            }`}
          >
            {tab.label}
            {selected ? (
              <span aria-hidden className="absolute left-0 right-0 -bottom-px h-px bg-accent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
