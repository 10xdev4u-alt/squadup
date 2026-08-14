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
    <li>
      <Link
        href="/admin"
        className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        Admin
      </Link>
    </li>
  );
}
