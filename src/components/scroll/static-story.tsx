import { BEATS, CHAPTERS } from "@/lib/timeline";
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
          {BEATS.filter((b) => b.at >= c.range[0] && b.at < c.range[1]).map((b) => (
            <div key={b.id} className="mb-12">
              {b.tag ? <Tag className="mb-3">{b.tag}</Tag> : null}
              <h2 className={b.id === "hero" ? "text-display-xl" : "text-display-l"}>{b.title}</h2>
              <p className="text-lead mt-4 max-w-[34ch] text-foreground/80">{b.lead}</p>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
