import Link from "next/link";
import { siteConfig } from "@/site.config";
import { DecorativePlus } from "@/components/DecorativePlus";
import { TerminalLauncher } from "@/components/terminal/TerminalLauncher";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t-[1.5px] border-ink px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-ui text-[11px] uppercase tracking-wider text-muted">
          © {year} {siteConfig.name}. Built with Next.js.
        </p>
        <nav className="flex flex-wrap items-center gap-5">
          <TerminalLauncher />
          {siteConfig.socials.map((social) => (
            <Link
              key={social.label}
              href={social.href}
              target={social.href.startsWith("http") ? "_blank" : undefined}
              rel={
                social.href.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
              className="font-ui text-[11px] font-bold uppercase tracking-wider text-ink/60 hover:text-accent"
            >
              {social.label}
            </Link>
          ))}
        </nav>
        <DecorativePlus className="hidden sm:block" />
      </div>
    </footer>
  );
}
