// Single source of truth for fonts. To swap in licensed fonts, change the
// imports/constructors in this file only; the CSS variables stay the same.
import { Newsreader, Geist, Geist_Mono } from "next/font/google";

export const fontDisplay = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: "variable",
  axes: ["opsz"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--nf-display",
});

export const fontText = Geist({
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--nf-text",
});

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
  adjustFontFallback: true,
  variable: "--nf-mono",
});

export const fontVariables = [fontDisplay, fontText, fontMono]
  .map((f) => f.variable)
  .join(" ");
