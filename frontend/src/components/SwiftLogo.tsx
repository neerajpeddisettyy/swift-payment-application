/** Renders the Swift wordmark and contactless payment icon. */
interface Props {
  size?: number;
  wordmark?: boolean;
}

export default function SwiftLogo({ size = 40, wordmark = false }: Props) {
  return (
    <span className="inline-flex items-center gap-2">
      {wordmark && (
        <span className="font-display text-lg font-semibold tracking-tight text-ink">Swift</span>
      )}
      <img
        src="/Nfc--Streamline-Lucide.svg"
        alt={wordmark ? "Contactless payment" : "Swift logo"}
        width={size}
        height={size}
        className="theme-logo"
      />
    </span>
  );
}
