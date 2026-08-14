// ============================================================================
// Avatar — shared identity badge. Renders the profile image when available,
// otherwise a deterministic-initials fallback (same name → same color) so the
// whole app feels coherent without requiring every user to upload a photo.
// Decorative by default (aria-hidden) — pair with visible name text.
// ============================================================================

import { cn } from "@/lib/utils";

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const AVATAR_COLORS = [
  "bg-primary/10 text-primary",
  "bg-cyan-500/10 text-cyan-300",
  "bg-fuchsia-500/10 text-fuchsia-300",
  "bg-amber-500/10 text-amber-300",
  "bg-emerald-500/10 text-emerald-300",
  "bg-rose-500/10 text-rose-300",
] as const;

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] as string;
}

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

export default function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn(
          "shrink-0 rounded-full border border-border bg-surface object-cover",
          SIZES[size],
          className
        )}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-border font-semibold",
        SIZES[size],
        colorFor(name),
        className
      )}
    >
      {initialsOf(name)}
    </div>
  );
}
