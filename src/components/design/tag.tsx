import { cn } from "@/lib/utils";

export function Tag({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-block rounded-[4px] bg-foreground/10 px-2 py-[5px] font-mono text-[9px] leading-none font-medium tracking-[0.12em] uppercase",
        className,
      )}
      {...props}
    />
  );
}
