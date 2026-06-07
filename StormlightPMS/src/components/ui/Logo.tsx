import { useId } from 'react';

/** The Stormlight mark: navy gradient tile + gold lightning bolt.
 *  Ported from design-handoff/assets/logo-mark.svg. */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  const id = useId();
  const tile = `tile-${id}`;
  const bolt = `bolt-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      role="img"
      aria-label="StormlightPMS"
      className={className}
    >
      <defs>
        <linearGradient id={tile} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B3D6B" />
          <stop offset="1" stopColor="#082A4B" />
        </linearGradient>
        <linearGradient id={bolt} x1="16" y1="7" x2="40" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5CE63" />
          <stop offset="1" stopColor="#F2C14E" />
        </linearGradient>
      </defs>
      <rect width="56" height="56" rx="14" fill={`url(#${tile})`} />
      <path d="M33 8 L17 31 L26.5 31 L23 48 L39 25 L29.5 25 Z" fill={`url(#${bolt})`} />
    </svg>
  );
}

/** Mark + wordmark lockup. `tone="light"` for dark backgrounds (sidebar/login panel). */
export function Logo({
  size = 32,
  tone = 'dark',
  className,
}: {
  size?: number;
  tone?: 'dark' | 'light';
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ''}`}>
      <LogoMark size={size} />
      <span
        className="font-display font-semibold leading-none"
        style={{ fontSize: 18, color: tone === 'light' ? '#FFFFFF' : 'var(--fg-1)' }}
      >
        Stormlight<span className="text-accent">PMS</span>
      </span>
    </div>
  );
}
