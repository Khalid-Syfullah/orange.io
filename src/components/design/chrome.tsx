"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent } from "motion/react";
import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { EASE } from "@/lib/motion";
import { progress as sharedProgress, scrollToProgress } from "@/lib/progress";
import { CHAPTERS, chapterIndex } from "@/lib/timeline";
import { cn } from "@/lib/utils";

const TICK_GAP = 18; // px between chapter ticks on the rail

function useActiveChapter(progress = sharedProgress) {
  const [active, setActive] = useState(() => chapterIndex(progress.get()));
  // state changes only when the chapter changes, never per scroll frame
  useMotionValueEvent(progress, "change", (v) => setActive(chapterIndex(v)));
  return active;
}

function Mark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={cn("size-5", className)}>
      <circle cx="10" cy="11" r="7" fill="var(--orange)" />
      <path d="M10 4C10 2 11.5 1 13.5 1C13.5 3 12 4.2 10 4Z" fill="var(--leaf)" />
    </svg>
  );
}

function ChapterList({ active, onSelect }: { active: number; onSelect: (i: number) => void }) {
  return (
    <ol className="grid gap-1">
      {CHAPTERS.map((c, i) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSelect(i)}
            aria-current={i === active ? "step" : undefined}
            className={cn(
              "text-label flex w-full items-center gap-3 rounded-[4px] px-2 py-3 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              i === active ? "text-foreground" : "text-foreground/50 hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("h-px bg-current transition-[width] duration-500 ease-out-soft", i === active ? "w-6" : "w-3")}
            />
            {c.label}
          </button>
        </li>
      ))}
    </ol>
  );
}

/** Fixed site chrome: mark, menu, chapter rail (collapses to a Sheet) and CTA. */
export function Chrome() {
  const active = useActiveChapter();
  const [open, setOpen] = useState(false);
  const go = (i: number) => {
    scrollToProgress(CHAPTERS[i].range[0]);
    setOpen(false);
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* mark + menu, aligned to the left hairline, inside the frame */}
      <div
        className="pointer-events-auto absolute flex flex-col items-start gap-3"
        style={{ left: "var(--v1)", top: "calc(var(--h1) + 14px)" }}
      >
        <Link
          href="/"
          aria-label="Orange.io home"
          className="rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Mark />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            aria-label="Open chapter menu"
            className="grid size-6 place-items-center rounded-[4px] text-foreground outline-none hover:text-orange focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LayoutGrid className="size-4" strokeWidth={1.5} />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="text-title">Chapters</SheetTitle>
              <SheetDescription className="text-meta">Jump to a part of the story</SheetDescription>
            </SheetHeader>
            <nav aria-label="Chapters" className="px-4">
              <ChapterList active={active} onSelect={go} />
            </nav>
            <SheetClose className="sr-only">Close</SheetClose>
          </SheetContent>
        </Sheet>
      </div>

      {/* chapter rail along the left hairline (desktop) */}
      <nav
        aria-label="Chapter rail"
        className="pointer-events-auto absolute top-1/2 hidden -translate-y-1/2 md:block"
        style={{ left: "calc(var(--v1) - 8px)" }}
      >
        <div className="relative" style={{ height: CHAPTERS.length * TICK_GAP, width: 220 }}>
          {CHAPTERS.map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={c.label}
              aria-current={i === active ? "step" : undefined}
              onClick={() => go(i)}
              className="absolute left-0 flex h-[18px] w-4 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ top: i * TICK_GAP }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-px transition-[width,background-color] duration-500 ease-out-soft",
                  i === active ? "w-4 bg-orange" : "w-2 bg-foreground/40",
                )}
              />
            </button>
          ))}
          <motion.div
            aria-hidden="true"
            className="absolute left-6 flex h-[18px] items-center gap-3"
            animate={{ y: active * TICK_GAP }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <span className="h-px w-5 bg-foreground/60" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={active}
                className="text-label whitespace-nowrap"
                initial={{ opacity: 0, y: "0.4em" }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: "-0.4em" }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {CHAPTERS[active].label}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>
      </nav>

      {/* CTA, top right inside the top hairline */}
      <div
        className="pointer-events-auto absolute"
        style={{ right: "calc(100% - var(--v2))", top: "calc(var(--h1) + 14px)" }}
      >
        <Button variant="pill" render={<a href="#contact" />} nativeButton={false}>
          Say hello
        </Button>
      </div>
    </div>
  );
}
