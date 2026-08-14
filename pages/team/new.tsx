import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { PRIMARY_ROLES, type PrimaryRole } from "@/types/squadup";
import type { ProblemStatement } from "@/lib/api/teams";
import { cn } from "@/lib/utils";

export default function FormTeam() {
  useRequireAuth();
  const router = useRouter();
  // When reached from a match chat (Form a Team), the partner joins as a
  // member — pass the match id through to the server (§2).
  const matchId =
    typeof router.query.match === "string" ? router.query.match : "";

  const [statements, setStatements] = useState<ProblemStatement[]>([]);
  const [name, setName] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [roles, setRoles] = useState<PrimaryRole[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api()
      .teams.fetchProblemStatements()
      .then((list) => {
        if (!cancelled) setStatements(list);
      })
      .catch(() => {
        if (!cancelled) setStatements([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleRole = (role: PrimaryRole) => {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role]
    );
  };

  const submit = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Team name is required.";
    if (roles.length === 0)
      nextErrors.roles = "Pick at least one role you need.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setApiError(null);
    setSubmitting(true);
    try {
      const team = await api().teams.createTeam({
        name: name.trim(),
        problemStatement: problemStatement || undefined,
        rolesNeeded: roles,
        match: matchId || undefined,
      });
      await router.push(`/team/${team.id}`);
    } catch (err) {
      setApiError(getApiErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Form a Team</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        A team unlocks the workspace — your partner joins as a member and both
        of you leave the discover deck.
      </p>

      {apiError && (
        <p
          role="alert"
          className="mt-4 rounded-card border border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger"
        >
          {apiError}
        </p>
      )}

      <div className="mt-6 max-w-md space-y-5">
        <div>
          <label htmlFor="team-name" className="block text-sm font-medium">
            Team name
          </label>
          <input
            id="team-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            aria-describedby={errors.name ? "team-name-error" : undefined}
            className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {errors.name && (
            <p
              id="team-name-error"
              role="alert"
              className="mt-1 text-xs text-danger"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="problem-statement"
            className="block text-sm font-medium"
          >
            Problem statement{" "}
            <span className="text-muted-foreground">(optional)</span>
          </label>
          <select
            id="problem-statement"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">No problem statement yet</option>
            {statements.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-medium">Roles needed</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRIMARY_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                aria-pressed={roles.includes(role)}
                onClick={() => toggleRole(role)}
                className={cn(
                  "rounded-control border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  roles.includes(role)
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-surface hover:bg-elevated"
                )}
              >
                {role}
              </button>
            ))}
          </div>
          {errors.roles && (
            <p role="alert" className="mt-1 text-xs text-danger">
              {errors.roles}
            </p>
          )}
        </fieldset>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="w-full rounded-control bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {submitting ? "Creating..." : "Create team"}
        </button>
      </div>
    </Layout>
  );
}
