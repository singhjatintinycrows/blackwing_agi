export function Chip({ children, pressed, onClick, variant = 'scope' }) {
  return (
    <button
      type="button"
      className={`dw-chip ${pressed ? 'dw-chip--pressed' : ''} ${variant === 'std' ? 'dw-chip--std' : ''}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
