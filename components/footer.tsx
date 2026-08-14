import Link from "next/link";

const PRODUCT_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/teams", label: "Browse Teams" },
  { href: "/auth", label: "Get started" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
        <div>
          <p className="font-display font-semibold">SquadUp</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Find your squad. Build something real.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-6">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-xs text-muted-foreground">
          Built for campus teams. &copy; {new Date().getFullYear()} SquadUp
        </p>
      </div>
    </footer>
  );
}
