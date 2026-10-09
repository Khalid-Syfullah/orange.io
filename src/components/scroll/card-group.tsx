"use client";

import { SplitReveal } from "@/components/design/split-reveal";
import { Tag } from "@/components/design/tag";
import { CARD_GROUPS } from "@/scroll/script";
import { SwapGroup, SwapFade, useSwap } from "./swap-group";

function Card({ index, count, tag, title, body }: { index: number; count: number; tag: string; title: string; body: string }) {
  const { progress, at, out } = useSwap();
  const len = out - at;
  // cards reveal one after another; titles by character, bodies fade up
  const start = at + len * (0.04 + 0.5 * (index / count));
  return (
    <article className="grid gap-3" data-card={index}>
      <Tag>{tag}</Tag>
      <SplitReveal as="h3" className="text-display-l" text={title} progress={progress} range={[start, out]} />
      <SwapFade from={0.1 + 0.5 * (index / count) + 0.06} to={0.1 + 0.5 * (index / count) + 0.18} className="text-body max-w-[34ch] text-foreground/80">
        {body}
      </SwapFade>
    </article>
  );
}

/**
 * One right-column card group (2 to 4 cards), fixed in the right third of the
 * viewport (it starts at 68%, clear of a centred subject and of the young canopy). Groups swap in place:
 * this one enters from below at `at`, reveals its cards in turn, and exits
 * upward at `out` as the next group enters.
 */
export function CardGroup({ index, at, out }: { index: number; at: number; out: number }) {
  const g = CARD_GROUPS[index];
  return (
    <SwapGroup
      at={at}
      out={out}
      data-g={index}
      aria-label={g.name}
      role="group"
      className="pointer-events-none absolute top-1/2 left-[8%] grid w-[84%] -translate-y-1/2 gap-7 md:left-[68%] md:w-[min(28vw,26rem)]"
    >
      {g.cards.map((c, i) => (
        <Card key={c.tag} index={i} count={g.cards.length} {...c} />
      ))}
    </SwapGroup>
  );
}
