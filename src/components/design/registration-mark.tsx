import { cn } from "@/lib/utils";

/** Four-point star glyph that sits where hairlines cross. */
export function RegistrationMark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      aria-hidden
      style={style}
      viewBox="0 0 12 12"
      className={cn("size-3 text-foreground", className)}
      fill="currentColor"
    >
      <path d="M6 0 C6.4 3.4 8.6 5.6 12 6 C8.6 6.4 6.4 8.6 6 12 C5.6 8.6 3.4 6.4 0 6 C3.4 5.6 5.6 3.4 6 0Z" />
    </svg>
  );
}
