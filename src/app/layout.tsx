import type { Metadata } from "next";
import { Silkscreen, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { TerminalProvider } from "@/components/terminal/TerminalProvider";
import { ThemeProvider, themeScript } from "@/components/ThemeProvider";
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
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "./",
  },
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.bio,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: [
    siteConfig.name,
    ...siteConfig.alternateNames,
    "Computer Engineering",
    "Business Administration",
    "Marmara University",
    "Universidad de Oviedo",
    "Portfolio",
    "Blog",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.bio,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.role}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.bio,
    images: ["/og-image.png"],
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  alternateName: siteConfig.alternateNames,
  url: siteConfig.url,
  image: `${siteConfig.url}/icon-512.png`,
  jobTitle: siteConfig.role,
  description: siteConfig.bio,
  sameAs: [
    "https://github.com/bilalyazicioglu",
    "https://www.linkedin.com/in/bilal-yazicioglu/",
  ],
  alumniOf: [
    {
      "@type": "EducationalOrganization",
      name: "Marmara University",
    },
    {
      "@type": "EducationalOrganization",
      name: "Universidad de Oviedo",
    },
  ],
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  image: `${siteConfig.url}/og-image.png`,
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
      // `data-theme` is written by the inline script below before React ever
      // sees this element, which is exactly the mismatch React would warn about.
      suppressHydrationWarning
    >
      <head>
        {/* First thing in <head>, so the palette is settled before the first
            paint rather than after it. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-48.png" type="image/png" sizes="48x48" />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512.png" type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([personJsonLd, webSiteJsonLd]),
          }}
        />
      </head>
      <body className="bg-grid min-h-full flex flex-col bg-canvas text-ink antialiased">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-3 py-6 sm:px-6 sm:py-10">
          <ThemeProvider>
            <TerminalProvider>
              <PanelFrame>
                <div className="flex flex-1 flex-col">
                  <Navbar />
                  <main className="flex flex-1 flex-col">{children}</main>
                  <Footer />
                </div>
              </PanelFrame>
            </TerminalProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  );
}
