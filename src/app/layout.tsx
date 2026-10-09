import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GrainOverlay } from "@/components/design/grain-overlay";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orange.io",
  description: "A calm, scroll-driven story about growing an orange.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>{children}</TooltipProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
