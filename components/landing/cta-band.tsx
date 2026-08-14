import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBand() {
  return (
    <section className="border-t border-border py-16">
      <div className="mx-auto max-w-2xl rounded-card border border-border bg-surface p-10 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight">
          Ready to find your squad?
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
          Join your classmates already building on SquadUp. It takes less than a
          minute to sign in.
        </p>
        <Link
          href="/auth"
          className="mt-6 inline-flex items-center gap-2 rounded-control bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          Get started
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
