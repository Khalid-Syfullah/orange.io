import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { TooltipProvider } from "@/components/ui/tooltip";
import { GrainOverlay } from "@/components/design/grain-overlay";
import { ScrollProvider } from "@/components/scroll/scroll-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orange.io",
  description: "A calm, scroll-driven story about growing an orange.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ScrollProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ScrollProvider>
        <GrainOverlay />
      </body>
    </html>
  );
}
