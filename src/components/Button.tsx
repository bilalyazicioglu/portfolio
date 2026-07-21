import Link from "next/link";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost";
  external?: boolean;
  className?: string;
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-ui text-xs font-bold uppercase tracking-wider transition-colors";

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-ink",
  outline: "border border-ink text-ink hover:bg-ink hover:text-surface",
  ghost: "text-ink hover:text-accent",
};

export function Button({
  href,
  children,
  variant = "primary",
  external,
  className = "",
}: ButtonProps) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
