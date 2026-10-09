"use client";

import { motion } from "motion/react";
import { SplitReveal } from "@/components/design/split-reveal";
import { Tag } from "@/components/design/tag";
import { EASE } from "@/lib/motion";
import { FOOTER, GROW, STEPS } from "@/content/page";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.4 },
  transition: { duration: 0.8, ease: EASE },
} as const;

/** "What we grow": three cards on cream, hairline above. */
export function WhatWeGrow() {
  return (
    <section id="what-we-grow" className="relative z-10 border-t border-hairline bg-cream px-[8%] py-28">
      <p className="text-label mb-5 text-ink/60">{GROW.label}</p>
      <SplitReveal as="h2" className="text-display-l mb-14 max-w-[20ch] text-ink" text={GROW.title} />
      <div className="grid gap-10 md:grid-cols-3">
        {GROW.cards.map((c, i) => (
          <motion.article key={c.tag} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="grid gap-3 border-t border-ink/20 pt-6 text-ink">
            <Tag>{c.tag}</Tag>
            <h3 className="text-display-l">{c.title}</h3>
            <p className="text-body max-w-[34ch] text-ink/75">{c.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

/** "How it works": three numbered steps on clay. */
export function HowItWorks() {
  return (
    <section className="relative z-10 border-t border-hairline bg-clay px-[8%] py-28">
      <p className="text-label mb-5 text-ink/60">{STEPS.label}</p>
      <SplitReveal as="h2" className="text-display-l mb-14 max-w-[20ch] text-ink" text={STEPS.title} />
      <ol className="grid gap-10 md:grid-cols-3">
        {STEPS.steps.map((s, i) => (
          <motion.li key={s.n} {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} className="grid gap-3 text-ink">
            <span className="text-label text-orange">{s.n}</span>
            <h3 className="text-title">{s.title}</h3>
            <p className="text-body max-w-[34ch] text-ink/75">{s.body}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/** The dark `--press` footer: a mono meta line and the brand mark. */
export function SiteFooter() {
  return (
    <footer data-press className="panel-press relative z-10 border-t border-cream/20 px-[8%] py-12">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <span className="flex items-center gap-3">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="size-6">
            <circle cx="10" cy="11" r="7" fill="var(--orange)" />
            <path d="M10 4C10 2 11.5 1 13.5 1C13.5 3 12 4.2 10 4Z" fill="var(--leaf)" />
          </svg>
          <span className="text-title">Orange.io</span>
        </span>
        <p className="text-meta text-cream/60">{FOOTER.meta}</p>
      </div>
    </footer>
  );
}
