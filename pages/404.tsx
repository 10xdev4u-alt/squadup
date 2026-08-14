import Link from "next/link";
import Layout from "@/components/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          This page wandered off
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be outdated, or the page never existed. Head back to the
          discover deck and keep swiping.
        </p>
        <Link
          href="/"
          className="mt-8 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Back to SquadUp
        </Link>
      </div>
    </Layout>
  );
}
