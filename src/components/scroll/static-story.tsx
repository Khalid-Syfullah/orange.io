import { BEATS, CARD_GROUPS, CHAPTERS } from "@/lib/timeline";
import { Tag } from "@/components/design/tag";

/** Reduced-motion fallback: stacked, non-animated chapters with still placeholders. */
export function StaticStory() {
  return (
    <div className="mx-auto max-w-3xl px-[8%] py-24">
      {CHAPTERS.map((c) => (
        <section key={c.id} id={`chapter-${c.id}`} className="border-t border-hairline py-16" aria-labelledby={`h-${c.id}`}>
          <p id={`h-${c.id}`} className="text-label mb-8 text-foreground/60">
            {c.label}
          </p>
          <div className="mb-10 grid aspect-[16/10] place-items-center bg-apricot/40 text-meta text-foreground/50">
            Still placeholder · {c.name}
          </div>
          {BEATS.filter((b) => b.at >= c.range[0] && b.at < c.range[1]).map((b) => b.kind === "cards" ? (
            <div key={b.id} className="mb-12 grid gap-8" aria-label={CARD_GROUPS[b.group!].name}>
              {CARD_GROUPS[b.group!].cards.map((card) => (
                <article key={card.tag} className="grid gap-2">
                  <Tag>{card.tag}</Tag>
                  <h3 className="text-display-l">{card.title}</h3>
                  <p className="text-body max-w-[34ch] text-foreground/80">{card.body}</p>
                </article>
              ))}
            </div>
          ) : (
            <div key={b.id} className="mb-12">
              {b.tag ? <Tag className="mb-3">{b.tag}</Tag> : null}
              <h2 className={b.id === "hero" || b.kind === "brand" ? "text-display-xl" : "text-display-l"}>{b.title}</h2>
              {b.tagline ? <p className="text-lead mt-4">{b.tagline}</p> : null}
              <p className="text-lead mt-4 max-w-[34ch] text-foreground/80">{b.lead}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
