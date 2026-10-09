import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** Delay between characters, ms. */
  stagger?: number;
};

/**
 * Characters roll vertically on hover/focus. Also reacts to a hovered ancestor
 * that has the `group` class (e.g. a link wrapping the text).
 */
export function HoverRoll({ text, className, stagger = 14 }: Props) {
  return (
    <span aria-label={text} className={cn("group/roll inline-flex whitespace-pre", className)}>
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
