/** Decorative concentric bridge arches (pure strokes, no dots). */
export default function Arches({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 200" aria-hidden="true" fill="none">
      <path d="M12 200 V108 A88 88 0 0 1 188 108 V200" stroke="#EE3524" strokeWidth="1.5" />
      <path d="M40 200 V112 A60 60 0 0 1 160 112 V200" stroke="#EE3524" strokeWidth="1.5" />
      <path d="M68 200 V116 A32 32 0 0 1 132 116 V200" stroke="#EE3524" strokeWidth="1.5" />
    </svg>
  );
}
