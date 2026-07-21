export type SocialLink = {
  label: string;
  href: string;
};

export type SiteConfig = {
  name: string;
  /** Short display name used for the big hero headline on the homepage. */
  heroName: string;
  role: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  availability: string;
  githubUsername: string;
  avatarUrl: string;
  resumeUrl: string;
  socials: SocialLink[];
};

/**
 * Edit this single file to personalize the site — every page
 * (home, about, projects, blog chrome) reads from here.
 */
export const siteConfig: SiteConfig = {
  name: "Ahmet Bilal Yazıcıoğlu",
  heroName: "Bilal Yazicioglu",
  role: "Software Engineering Student",
  tagline: "Full-stack developer & distributed systems enthusiast.",
  bio: "Software Engineering student at Marmara University with practical experience in full-stack development and distributed systems, complemented by a solid understanding of business administration frameworks. Proficient in Java, Go, and Python, with expertise in Spring Boot, Docker, and PostgreSQL. Committed to building scalable architectures and optimizing CI/CD workflows.",
  location: "Istanbul, TR",
  email: "ahmetbilalyazicioglu@gmail.com",
  availability: "Open to internships & collaborations",
  githubUsername: "bilalyazicioglu",
  avatarUrl: "https://avatars.githubusercontent.com/u/186031308?v=4",
  resumeUrl: "/resume.pdf",
  socials: [
    { label: "GitHub", href: "https://github.com/bilalyazicioglu" },
    { label: "LinkedIn", href: "https://linkedin.com/in/bilal-yazicioglu" },
    { label: "Email", href: "mailto:ahmetbilalyazicioglu@gmail.com" },
  ],
};
