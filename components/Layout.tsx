import Link from "next/link";
import type { ReactNode } from "react";
import TeamNavLink from "@/components/team-nav-link";
import AdminNavLink from "@/components/admin-nav-link";
import TabBar from "@/components/tab-bar";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            SquadUp
          </Link>
          <nav aria-label="Context" className="flex items-center gap-3">
            <TeamNavLink />
            <AdminNavLink />
          </nav>
        </div>
      </header>
      <main
        id="main-content"
        className="mx-auto max-w-5xl px-6 pb-32 pt-8 sm:pt-10"
      >
        {children}
      </main>
      <TabBar />
    </div>
  );
}
