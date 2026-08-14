import type { AppProps } from "next/app";
import Head from "next/head";
import { Component, type ReactNode } from "react";
import { inter, jetbrainsMono, spaceGrotesk } from "@/lib/fonts";
import "@/styles/globals.css";

const PAGE_TITLES: Record<string, string> = {
  "/": "SquadUp — Find your SIH team",
  "/discover": "Discover — SquadUp",
  "/matches": "Matches — SquadUp",
  "/teams": "Browse Teams — SquadUp",
  "/profile": "Profile — SquadUp",
  "/auth": "Sign in — SquadUp",
  "/onboarding": "Finish your profile — SquadUp",
  "/onboarding/skills": "Pick your skills — SquadUp",
};

function titleFor(pathname: string): string {
  if (pathname.startsWith("/team/")) return "Team workspace — SquadUp";
  if (pathname.startsWith("/teams/")) return "Team — SquadUp";
  if (pathname.startsWith("/admin")) return "Admin — SquadUp";
  return PAGE_TITLES[pathname] ?? "SquadUp";
}

// §5.3 — an uncaught render error shows a recoverable screen instead of a
// white flash; the retry re-mounts the subtree.
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
          <div className="max-w-md rounded-card border border-border bg-card p-8 text-center">
            <p className="font-display text-lg font-semibold">
              Something went wrong
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              An unexpected error interrupted this page. Reload to try again.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="mt-6 rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App({ Component, pageProps, router }: AppProps) {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen font-sans`}
    >
      <Head>
        <title>{titleFor(router.pathname)}</title>
      </Head>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </div>
  );
}
