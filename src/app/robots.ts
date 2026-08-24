import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Cloudflare rewrites every mailto: link on the page into
        // /cdn-cgi/l/email-protection#<hex>. The address is in the fragment,
        // which a crawler never sends, so Googlebot fetches the bare path and
        // gets a 404 — reported in Search Console as a missing page. Nothing
        // under /cdn-cgi/ is ours or worth crawling.
        disallow: "/cdn-cgi/",
      },
      {
        userAgent: "Googlebot-Image",
        allow: "/",
      },
      {
        userAgent: "Googlebot-Favicon",
        allow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
