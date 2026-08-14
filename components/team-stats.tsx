interface TeamStatsProps {
  members: number;
  openTickets: number;
  resources: number;
}

const STATS: Array<{ key: keyof TeamStatsProps; label: string }> = [
  { key: "members", label: "Members" },
  { key: "openTickets", label: "Open tickets" },
  { key: "resources", label: "Resources" },
];

export default function TeamStats({
  members,
  openTickets,
  resources,
}: TeamStatsProps) {
  const values: Record<keyof TeamStatsProps, number> = {
    members,
    openTickets,
    resources,
  };

  return (
    <dl className="grid grid-cols-3 gap-4 rounded-card border border-border bg-card p-5">
      {STATS.map((stat) => (
        <div key={stat.key} className="text-center">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </dt>
          <dd className="mt-1 font-display text-2xl font-bold">
            {values[stat.key]}
          </dd>
        </div>
      ))}
    </dl>
  );
}
