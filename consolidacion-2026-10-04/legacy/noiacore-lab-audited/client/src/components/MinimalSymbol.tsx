/**
 * NOIACORE LAB / brand mark
 * Símbolo geométrico de A mayúscula: blanco mineral, hendidura negra y ningún halo cromático.
 */
interface MinimalSymbolProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export function MinimalSymbol({ className = '', size = 32 }: MinimalSymbolProps) {
  return (
    <span
      className={`noia-symbol ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M50 10 87 90H68L50 48 32 90H13L50 10Z" fill="currentColor" />
        <path d="M50 7v45" stroke="#000" strokeWidth="4" strokeLinecap="square" />
        <path d="M50 12v26" stroke="#E8E8EB" strokeWidth="1.25" strokeLinecap="square" />
      </svg>
    </span>
  );
}
