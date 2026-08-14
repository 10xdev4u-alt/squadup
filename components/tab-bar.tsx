// ============================================================================
// TabBar — iOS-style bottom navigation. Fixed, frosted glass, active pill
// indicator, icons + labels. The four core destinations live here; context
// items (My Team / Admin) stay in the top header so the tab set never shifts.
// ============================================================================

import Link from "next/link";
import { Compass, Heart, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/matches", label: "Matches", icon: Heart },
  { href: "/teams", label: "Browse Teams", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function TabBar() {
  // No router dependency: active state is derived from the real URL so the
  // bar renders anywhere (SSR, tests, preview) without a router provider.
  const path = typeof window === "undefined" ? "" : window.location.pathname;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/15"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.4 : 2}
                  aria-hidden="true"
                />
              </span>
              <span className="leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
