import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { ArrowUpRight } from "lucide-react"
import { cn } from "cn"

import { HoverRoll } from "@/components/design/hover-roll"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Orange.io pills (see DESIGN.md): hairline border, inset top highlight, dark bottom edge.
        pill: "group group/pill rounded-full border-foreground/20 bg-transparent text-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_0_rgb(0_0_0/0.35)] duration-500 ease-out-soft hover:border-foreground/40",
        "pill-light":
          "group group/pill rounded-full border-cream/20 bg-transparent text-cream shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_0_rgb(0_0_0/0.35)] duration-500 ease-out-soft hover:border-cream/40",
        orange:
          "group group/pill rounded-full border-ink/20 bg-orange text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_0_rgb(0_0_0/0.35)] duration-500 ease-out-soft hover:border-ink/40",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        pill: "h-11 gap-3 py-1.5 pr-1.5 pl-5 font-mono text-[0.6875rem] tracking-[0.18em] uppercase",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const PILL_VARIANTS = ["pill", "pill-light", "orange"] as const
const CHIP_CLASS: Record<(typeof PILL_VARIANTS)[number], string> = {
  pill: "bg-foreground text-background",
  "pill-light": "bg-cream text-press",
  orange: "bg-ink text-orange",
}

function Button({
  className,
  variant = "default",
  size,
  children,
  arrow = true,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & { arrow?: boolean }) {
  const pill = PILL_VARIANTS.find((v) => v === variant)
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({ variant, size: size ?? (pill ? "pill" : "default"), className })
      )}
      {...props}
    >
      {pill && arrow ? (
        <>
          <span>{typeof children === "string" ? <HoverRoll text={children} /> : children}</span>
          <span
            aria-hidden
            className={cn(
              "grid size-8 place-items-center rounded-[6px] transition-transform duration-500 ease-out-soft group-hover/pill:translate-x-0.5 motion-reduce:transition-none",
              CHIP_CLASS[pill]
            )}
          >
            <ArrowUpRight className="size-3.5" strokeWidth={1.5} />
          </span>
        </>
      ) : (
        children
      )}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
