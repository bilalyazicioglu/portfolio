import { NextResponse } from "next/server";
import { siteConfig } from "@/site.config";
import { getAllPosts } from "@/lib/blog";
import { projects } from "@/lib/projects";
import { education, skills } from "@/lib/resume";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  const posts = getAllPosts();
  const baseUrl = siteConfig.url;

  const projectLines = projects
    .map((p) => {
      const stats = p.stats.map((s) => `${s.label}: ${s.value}`).join(", ");
      const link = p.href ? `\n- Link: ${p.href}` : "";
      return `### ${p.name} (${p.category})
${p.description}${link}
- Highlights: ${stats}`;
    })
    .join("\n\n");

  const postLines = posts
    .map((post) => {
      return `- [${post.title}](${baseUrl}/blog/${post.slug}) (${post.date}, ${post.lang.toUpperCase()}): ${post.summary}`;
    })
    .join("\n");

  const skillLines = Object.entries(skills)
    .map(([group, list]) => `- **${group}**: ${list.join(", ")}`)
    .join("\n");

  const eduLines = education
    .map((e) => `- **${e.school}** (${e.place}, ${e.period}): ${e.program}`)
    .join("\n");

  const content = `# ${siteConfig.name} (${siteConfig.heroName})

> ${siteConfig.role} based in ${siteConfig.location}.
> ${siteConfig.bio}

## Identity & Canonical Links
- Canonical Website: ${siteConfig.url}
- GitHub: https://github.com/${siteConfig.githubUsername}
- LinkedIn: https://www.linkedin.com/in/bilal-yazicioglu/
- Email: ${siteConfig.email}
- Availability: ${siteConfig.availability}
- Alternate Names: ${siteConfig.alternateNames.join(", ")}

## Education
${eduLines}

## Skills & Technologies
${skillLines}
- **Systems & Architecture**: Distributed Systems, Peer-to-Peer (P2P), QUIC Protocol, Hexagonal Architecture, Microservices
- **Web & Mobile**: Next.js, React, Node.js, Express, Three.js, WebAR, Tailwind CSS
- **Observability & DevOps**: Docker, Nginx, Cloudflare, Prometheus, Grafana, Loki, GitHub Actions

## Featured Software Projects
${projectLines}

## Publications & Technical Writings
${postLines}

## Open Source & Leadership
- **Tuta**: Localization Translator for open-source privacy-first email and calendar client.
- **University Basketball**: Marmara University and Universidad de Oviedo competitive athlete applying sports discipline to engineering teamwork.
`;

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
