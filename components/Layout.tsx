import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import TeamNavLink from "@/components/team-nav-link";
import AdminNavLink from "@/components/admin-nav-link";

const NAV_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" },
  { href: "/teams", label: "Browse Teams" },
  { href: "/profile", label: "Profile" },
];

function isActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label }: { href: string; label: string }) {
  const [pathname, setPathname] = useState("");
  useEffect(() => {
    setPathname(window.location.pathname);
  }, []);
  const active = isActive(href, pathname);

  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`rounded-control px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          active
            ? "bg-elevated font-medium text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            SquadUp
          </Link>
          <nav aria-label="Main">
            <ul className="flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.href} href={link.href} label={link.label} />
              ))}
              <TeamNavLink />
              <AdminNavLink />
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-7xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
