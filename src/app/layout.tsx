import type { Metadata } from "next";
import { Silkscreen, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PanelFrame } from "@/components/PanelFrame";
import { siteConfig } from "@/site.config";

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  weight: ["400", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${silkscreen.variable} ${jetbrainsMono.variable} ${inter.variable} h-full`}
    >
      <body className="bg-grid min-h-full flex flex-col bg-canvas text-ink antialiased">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-6 sm:px-6 sm:py-10">
          <PanelFrame>
            <div className="flex flex-1 flex-col">
              <Navbar />
              <main className="flex flex-1 flex-col">{children}</main>
              <Footer />
            </div>
          </PanelFrame>
        </div>
      </body>
    </html>
  );
}
