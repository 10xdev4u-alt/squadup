// ============================================================================
// Admin nav link — visible only to users with the admin flag (PB-dashboard
// seeded, §4E). Renders nothing otherwise, so non-admins never see the
// admin surface.
// ============================================================================

import Link from "next/link";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";

export default function AdminNavLink() {
  const user = getCurrentUser(getClient());
  if (!user?.admin) return null;

  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      Admin
    </Link>
  );
}
