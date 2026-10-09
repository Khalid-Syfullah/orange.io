import type { Metadata } from "next";
import { SplitReveal } from "@/components/design/split-reveal";
import { PillButton } from "@/components/design/pill-button";
import { Tag } from "@/components/design/tag";
import { RegistrationMark } from "@/components/design/registration-mark";

export const metadata: Metadata = { title: "Design — Orange.io", robots: { index: false } };

const swatches = [
  ["orange", "#FF7800", "bg-orange"],
  ["cream", "#F7F3EA", "bg-cream"],
  ["ink", "#181818", "bg-ink"],
  ["press", "#0F0D0A", "bg-press"],
  ["leaf", "#476B35", "bg-leaf"],
  ["apricot", "#FFD9A8", "bg-apricot"],
  ["clay", "#E9DCC6", "bg-clay"],
] as const;

const scale = [
  ["display-xl", "text-display-xl", "Water it slowly"],
  ["display-l", "text-display-l", "Something small is growing"],
  ["title", "text-title", "The seed, then the leaf"],
  ["lead", "text-lead", "Two people, one tree, a long afternoon."],
  ["body", "text-body", "Body copy sits quietly beside the art, set in Geist at a small, even size."],
  ["label", "text-label", "Chapter one — the seed"],
  ["meta", "text-meta", "Meta · 2026 · Orange.io"],
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-hairline py-12">
      <p className="text-label mb-8 text-foreground/60">{title}</p>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-[5.3vw] py-16">
      <h1 className="text-display-xl mb-12">
        Design <em>system</em>
      </h1>

      <Section title="Type scale">
        <div className="grid gap-8">
          {scale.map(([name, cls, sample]) => (
            <div key={name} className="grid items-baseline gap-2 md:grid-cols-[10rem_1fr]">
              <span className="text-meta text-foreground/60">{name}</span>
              <p className={cls}>{sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {swatches.map(([name, hex, cls]) => (
            <div key={name}>
              <div className={`${cls} aspect-square rounded-[4px] border border-hairline`} />
              <p className="text-label mt-2">{name}</p>
              <p className="text-meta text-foreground/60">{hex}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Pill button and tag">
        <div className="flex flex-wrap items-center gap-6">
          <PillButton href="#">Say hello</PillButton>
          <Tag>Chapter 1</Tag>
          <Tag>Seed</Tag>
        </div>
      </Section>

      <Section title="Hairline grid with registration marks">
        <div className="relative h-64 border border-hairline">
          <div className="hairline-y absolute inset-y-0 left-[5.3%]" />
          <div className="hairline-y absolute inset-y-0 left-[85.6%]" />
          <div className="hairline-x absolute inset-x-0 top-[12%]" />
          <div className="hairline-x absolute inset-x-0 top-[72%]" />
          {[
            ["5.3%", "12%"],
            ["85.6%", "12%"],
            ["5.3%", "72%"],
            ["85.6%", "72%"],
          ].map(([l, t]) => (
            <RegistrationMark
              key={l + t}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: l, top: t }}
            />
          ))}
        </div>
      </Section>

      <Section title="Character-split headline">
        <SplitReveal as="h2" className="text-display-l max-w-2xl" text="A quiet orange tree, grown one scroll at a time." />
      </Section>
    </main>
  );
}
