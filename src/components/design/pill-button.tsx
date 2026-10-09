import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"a"> & { children: React.ReactNode };

/** Pill CTA: hairline border, inset top highlight, dark bottom edge, arrow chip. */
export function PillButton({ children, className, ...props }: Props) {
  return (
    <a
      className={cn(
        "group inline-flex items-center gap-3 rounded-full border border-foreground/20 py-1.5 pr-1.5 pl-5",
        "text-label text-foreground transition-[border-color] duration-500 ease-out-soft hover:border-foreground/40",
        "shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_0_rgb(0_0_0/0.35)]",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <span className="grid size-7 place-items-center rounded-[6px] bg-foreground text-background transition-transform duration-500 ease-out-soft group-hover:translate-x-0.5">
        <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
      </span>
    </a>
  );
}
