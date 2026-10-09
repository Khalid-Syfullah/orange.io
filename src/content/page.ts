// TODO(copy): all placeholder text for the sections after the stage.
export const GROW = {
  label: "What we grow",
  title: "Small beginnings, taken seriously.",
  cards: [
    { tag: "01 Ideas", title: "Early ideas.", body: "TODO: one short paragraph about what we plant." },
    { tag: "02 Teams", title: "Patient teams.", body: "TODO: one short paragraph about what we tend." },
    { tag: "03 Brands", title: "Lasting brands.", body: "TODO: one short paragraph about what we harvest." },
  ],
} as const;

export const STEPS = {
  label: "How it works",
  title: "Three steps, in the open.",
  steps: [
    { n: "01", title: "We listen.", body: "TODO: one short paragraph about the first conversation." },
    { n: "02", title: "We grow it with you.", body: "TODO: one short paragraph about the work." },
    { n: "03", title: "We hand it over.", body: "TODO: one short paragraph about the harvest and what comes after." },
  ],
} as const;

export const FOOTER = { meta: "Orange.io · TODO address line · TODO year" } as const;
