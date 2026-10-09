"use client";

import { useState } from "react";
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
} from "@/components/ui/sheet";
import { scrollToChapter } from "@/lib/progress";
import { CHAPTERS } from "@/lib/timeline";
import { ChapterRail, MobileRail, useActiveChapter } from "./rail";
import { HoverRoll } from "./hover-roll";
import { cn } from "@/lib/utils";

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
              "group text-label flex w-full items-center gap-3 rounded-[4px] px-2 py-3 text-left outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring",
              i === active ? "text-foreground" : "text-foreground/50 hover:text-foreground",
            )}
          >
            <span
              aria-hidden="true"
              className={cn("h-px bg-current transition-[width] duration-500 ease-out-soft", i === active ? "w-6" : "w-3")}
            />
            <HoverRoll text={c.label} />
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
    scrollToChapter(i);
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
          </SheetContent>
        </Sheet>
      </div>

      {/* chapter rail along the left hairline (desktop), below the lower hairline so it never meets the text columns */}
      <div
        className="absolute hidden md:block"
        style={{
          opacity: "var(--rail-opacity, 1)",
          left: "calc(var(--v1) - 3px)",
          top: "calc(var(--h2) + 20px)",
          height: "clamp(90px, calc(100% - var(--h2) - 56px), 170px)",
        }}
      >
        <ChapterRail onSelect={go} height="100%" />
      </div>

      {/* compact indicator (mobile); the menu Sheet holds the chapter list */}
      <MobileRail className="absolute inset-x-4 top-1.5 opacity-[var(--rail-opacity,1)] md:hidden" />

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
