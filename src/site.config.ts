export type SocialLink = {
  label: string;
  href: string;
};

export type SiteConfig = {
  name: string;
  /** Short display name used for the big hero headline on the homepage. */
  heroName: string;
  alternateNames: string[];
  url: string;
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
  alternateNames: [
    "Bilal Yazıcıoğlu",
    "Bilal Yazicioglu",
    "Ahmet Bilal Yazicioglu",
    "A. Bilal Yazıcıoğlu",
  ],
  url: "https://bilalyazicioglu.com.tr",
  role: "Computer Engineering & Business Administration Student",
  tagline: "Code, hoops, nature, and exploring new places.",
  bio: "I'm a Computer Engineering and Business Administration student at Marmara University (enrolled in 2024), including a memorable Erasmus semester at Universidad de Oviedo in Spain. Beyond tech and classes, I feel most at ease on the basketball court, traveling to new places, hanging out with friends, or recharging on long hikes in nature.",
  location: "Istanbul, TR",
  email: "ahmetbilalyazicioglu@gmail.com",
  availability: "Open to internships & collaborations",
  githubUsername: "bilalyazicioglu",
  avatarUrl: "/icon.png",
  resumeUrl: "/resume.pdf",
  socials: [
    { label: "GitHub", href: "https://github.com/bilalyazicioglu" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/bilal-yazicioglu/" },
    { label: "Email", href: "mailto:ahmetbilalyazicioglu@gmail.com" },
  ],
};
