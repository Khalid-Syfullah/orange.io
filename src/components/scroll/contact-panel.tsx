"use client";

import { useRef, useState } from "react";
import { useScroll } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SplitReveal } from "@/components/design/split-reveal";
import { SwapGroup } from "./swap-group";

/** TODO(copy): placeholder terms. Two groups of two paragraphs, swapped by scroll. */
const TERMS = [
  ["TODO: how we begin. One short paragraph about the first conversation and what we ask.", "TODO: how we decide. One short paragraph about shared goals and honest limits."],
  ["TODO: how we work. One short paragraph about cadence, care and communication.", "TODO: how we finish. One short paragraph about handing the work over and staying in touch."],
] as const;

function Terms() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return (
    <div ref={ref} className="relative h-[320svh]" aria-label="How we work together">
      <div className="sticky top-0 grid h-svh content-center gap-10 px-[8%]">
        <div>
          <p className="text-label mb-4 text-foreground/60">Terms</p>
          <SplitReveal as="h2" className="text-display-l max-w-[18ch]" text="How we work together" />
        </div>
        <div className="relative min-h-56">
          {TERMS.map((pair, f) => (
            <SwapGroup
              key={f}
              at={0.08 + f * 0.46}
              out={f === 0 ? 0.54 : 0.96}
              progress={scrollYProgress}
              data-f={f}
              className="absolute inset-0 grid gap-8 md:grid-cols-2"
            >
              {pair.map((text, i) => (
                <p key={i} className="text-lead max-w-[30ch] text-foreground/85">
                  {text}
                </p>
              ))}
            </SwapGroup>
          ))}
        </div>
      </div>
    </div>
  );
}

type Errors = Partial<Record<"name" | "email" | "project", string>>;

/** A small contact form: accessible labels, inline validation, a success state. No backend. */
function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const project = String(data.get("project") ?? "").trim();
    const next: Errors = {};
    if (!name) next.name = "Please tell us your name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) next.email = "Please enter a valid email address.";
    if (!project) next.project = "Tell us a little about what you are growing.";
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(name);
  }

  if (sent) {
    return (
      <div role="status" aria-live="polite" data-state="success" className="grid gap-3">
        <SplitReveal as="h3" className="text-display-l" text="Thank you." />
        <p className="text-lead max-w-[30ch] text-foreground/85">TODO: confirmation copy. We will be in touch, {sent}.</p>
        <Button variant="pill-light" type="button" onClick={() => setSent(null)} className="mt-4 w-fit">
          Send another
        </Button>
      </div>
    );
  }

  const field = (key: keyof Errors, label: string) => ({
    id: `contact-${key}`,
    name: key,
    "data-k": key,
    "aria-invalid": errors[key] ? true : undefined,
    "aria-describedby": errors[key] ? `contact-${key}-error` : undefined,
    label,
  });
  const f = { name: field("name", "Name"), email: field("email", "Email"), project: field("project", "What are you growing?") };

  return (
    <form onSubmit={onSubmit} noValidate aria-labelledby="contact-title" className="grid w-full max-w-xl gap-6">
      <div className="grid gap-2">
        <p className="text-label text-foreground/60">Say hello</p>
        <SplitReveal as="h2" className="text-display-l" text="Let’s grow something." />
      </div>
      {(["name", "email"] as const).map((k) => (
        <div key={k} className="grid gap-2">
          <Label htmlFor={f[k].id} className="text-label">
            {f[k].label}
          </Label>
          <Input
            id={f[k].id}
            name={k}
            type={k === "email" ? "email" : "text"}
            autoComplete={k === "email" ? "email" : "name"}
            data-k={k}
            aria-invalid={f[k]["aria-invalid"]}
            aria-describedby={f[k]["aria-describedby"]}
            className="h-11 border-foreground/25 bg-transparent text-foreground"
          />
          {errors[k] ? (
            <p id={`contact-${k}-error`} role="alert" className="text-meta text-orange">
              {errors[k]}
            </p>
          ) : null}
        </div>
      ))}
      <div className="grid gap-2">
        <Label htmlFor={f.project.id} className="text-label">
          {f.project.label}
        </Label>
        <Textarea
          id={f.project.id}
          name="project"
          rows={4}
          data-k="project"
          aria-invalid={f.project["aria-invalid"]}
          aria-describedby={f.project["aria-describedby"]}
          className="border-foreground/25 bg-transparent text-foreground"
        />
        {errors.project ? (
          <p id="contact-project-error" role="alert" className="text-meta text-orange">
            {errors.project}
          </p>
        ) : null}
      </div>
      <Button type="submit" variant="orange" className="w-fit">
        Send
      </Button>
    </form>
  );
}

/**
 * The closing panel in the deep --press tone: a pinned "How we work together"
 * block whose two groups swap with scroll, then the contact form.
 */
export function ContactPanel() {
  return (
    <section id="contact" data-press className="panel-press relative z-10">
      <Terms />
      <div className="grid min-h-svh content-center px-[8%] py-24">
        <span id="contact-title" className="sr-only">
          Contact
        </span>
        <ContactForm />
      </div>
    </section>
  );
}
