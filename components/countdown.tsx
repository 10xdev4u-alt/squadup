// ============================================================================
// Countdown — the §9 team-dashboard timer: mono type, live tick, and a red
// pulse once the deadline is under 24h away. Pure presentational component;
// the deadline arrives via TeamDetail.deadline (server-derived, I19).
// ============================================================================

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const URGENT_MS = 24 * 3600 * 1000;

function remainingMs(deadline: string, now: number): number {
  return new Date(deadline).getTime() - now;
}

function formatHours(ms: number): string {
  if (ms <= 0) return "0h";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}

export default function Countdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = remainingMs(deadline, now);
  const urgent = remaining > 0 && remaining < URGENT_MS;

  return (
    <time
      role="timer"
      dateTime={deadline}
      aria-label="Time until deadline"
      className={cn(
        "font-mono text-4xl font-semibold tabular-nums tracking-tight",
        urgent && "animate-pulse text-destructive"
      )}
    >
      {formatHours(remaining)}
    </time>
  );
}
