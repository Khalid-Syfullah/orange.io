This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


## Hero experience

Orange.io is one tall, native-scrolling stage (`STAGE_VH`, 2400 svh; 70% on small screens). A fixed, sticky stack of layers holds a persistent WebGL scene canvas, the fly layer (the orange across a dissolve), halftone clouds, the hairline frame, and the DOM text beats. Lenis and one GSAP ScrollTrigger write a single normalized `progress`; everything else reads it and is a pure function of it, so scrolling backward reverses the story exactly.

The story, in order: the opening (man, woman, small tree), watering, the tree growing, the oranges ripening, a hand plucking one, the orange floating and turning in a cream studio, splitting into two halves, and the Orange.io brand reveal, followed by normal page content (what we grow, how it works, terms, a contact form, footer).

- `DESIGN.md` is the design spec, with the notes and final values for each scene. `SCROLL.md` is the scroll script: pacing budget, beat table, travel table, chapter anchors, dissolve windows, frame states.
- `src/scroll/script.ts` holds all the choreography data; `npm test` validates it and the pure timing functions (`src/scroll/*.test.ts`).
- `src/scene/models.ts` has the model slots: the people, tree, hand and fruit are procedural placeholders; set a GLB `url` to replace one.
- Dev: `npm run dev` shows a script timeline and a progress readout (keys 1 to 8 jump to scenes, `h` hides them); `/design` shows the UI kit. `J` / `K` jump between beats; `/#seed`, `#growth`, `#harvest`, `#inside` deep-link to chapters.
- Reduced motion shows the whole story as still frames with all copy.
