import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: 'default' | 'ghost' | 'danger';
}

const toneClasses = {
  default:
    'border-border hover:border-accent hover:text-accent focus-visible:border-accent text-text',
  ghost: 'border-transparent hover:border-border text-text-muted hover:text-text',
  danger:
    'border-border hover:border-danger hover:text-danger focus-visible:border-danger text-text-muted',
};

export function Button({
  tone = 'default',
  className = '',
  children,
  ...rest
}: ButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 border px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${toneClasses[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
