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
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.bio,
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/apple-touch-icon.png",
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
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.bio,
  },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: siteConfig.name,
  alternateName: siteConfig.alternateNames,
  url: siteConfig.url,
  image: `${siteConfig.url}/icon.png`,
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
      <head>
        <link rel="icon" href="/icon.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
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
