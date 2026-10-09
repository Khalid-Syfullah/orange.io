import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** Delay between characters, ms. */
  stagger?: number;
};

/**
 * Characters roll vertically on hover/focus. Also reacts to a hovered or
 * focused ancestor that has the `group` class (a link or button wrapping it).
 * The visible characters are aria-hidden; screen readers get the plain text.
 */
export function HoverRoll({ text, className, stagger = 14 }: Props) {
  return (
    <span className={cn("group/roll inline-flex whitespace-pre", className)}>
      <span className="sr-only">{text}</span>
      {Array.from(text).map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="relative inline-block overflow-hidden align-bottom leading-[1.15]"
        >
          <span
            className="block transition-transform duration-500 ease-out-soft group-hover/roll:-translate-y-full group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:transform-none motion-reduce:transition-none"
            style={{ transitionDelay: `${i * stagger}ms` }}
          >
            {ch}
          </span>
          <span
            className="absolute top-full left-0 block transition-transform duration-500 ease-out-soft group-hover/roll:-translate-y-full group-hover:-translate-y-full group-focus-visible:-translate-y-full motion-reduce:hidden"
            style={{ transitionDelay: `${i * stagger}ms` }}
          >
            {ch}
          </span>
        </span>
      ))}
    </span>
  );
}
