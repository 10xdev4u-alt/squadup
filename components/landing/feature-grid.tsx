import {
  Heart,
  Users,
  LayoutDashboard,
  MessageSquare,
  Kanban,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

const FEATURES: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Swipe to match",
    description:
      "Browse classmates by role and skills. Swipe right and matching is instant — no awkward cold DMs.",
    icon: Heart,
  },
  {
    title: "Form your team",
    description:
      "Pick a problem statement, set the roles you need, and share an invite code with your campus.",
    icon: Users,
  },
  {
    title: "Team workspace",
    description:
      "Every team gets a home: member roster, problem statement, and the status of who's doing what.",
    icon: LayoutDashboard,
  },
  {
    title: "Real-time chat",
    description:
      "Match chats and team channels update live. Your messages land without refreshing a thing.",
    icon: MessageSquare,
  },
  {
    title: "Built-in kanban",
    description:
      "Track the build with tickets and a five-column board — To do, In progress, and beyond.",
    icon: Kanban,
  },
  {
    title: "College-first",
    description:
      "Sign in with your college email, prove it's you, and keep everything on campus.",
    icon: GraduationCap,
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-16">
      <h2 className="text-center font-display text-3xl font-bold tracking-tight">
        Everything you need to ship
      </h2>
      <p className="mx-auto mt-3 max-w-md text-center text-sm text-muted-foreground">
        From the first swipe to the final demo, SquadUp covers the whole
        lifecycle of a campus project.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className="rounded-card border border-border bg-card p-6 transition-colors hover:border-border/80 hover:bg-elevated"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-control bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
