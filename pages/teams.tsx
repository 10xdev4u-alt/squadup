import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import EmptyState from "@/components/empty-state";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import {
  PRIMARY_ROLES,
  type PrimaryRole,
  type TeamCard,
} from "@/types/squadup";
import type { Paginated } from "@/lib/api/pagination";
import { cn } from "@/lib/utils";

const PER_PAGE = 12;

export default function TeamDirectory() {
  useRequireAuth();
  const router = useRouter();
  const [result, setResult] = useState<Paginated<TeamCard> | null>(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<PrimaryRole | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const load = useCallback(
    async (targetPage: number, targetRole: PrimaryRole | undefined) => {
      setError(null);
      try {
        const next = await api().teams.fetchTeamCards(
          targetPage,
          PER_PAGE,
          targetRole ? { role: targetRole } : undefined
        );
        setResult(next);
        setPage(next.page);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong on our end."
        );
      }
    },
    []
  );

  useEffect(() => {
    void load(1, undefined);
  }, [load]);

  const toggleRole = (candidate: PrimaryRole) => {
    const next = role === candidate ? undefined : candidate;
    setRole(next);
    void load(1, next);
  };

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Browse Teams</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Open teams looking for their missing roles.
      </p>

      <form
        className="mt-6 flex max-w-md flex-col gap-3 rounded-card border border-border bg-card p-4 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = code.trim();
          if (!trimmed || lookingUp) return;
          setLookingUp(true);
          setCodeError(null);
          api()
            .teams.fetchTeamByInvite(trimmed)
            .then((team) => {
              if (!team) {
                setCodeError("No team with that code was found.");
                return;
              }
              void router.push(`/teams/${team.id}`);
            })
            .catch((err) => setCodeError(getApiErrorMessage(err)))
            .finally(() => setLookingUp(false));
        }}
      >
        <label htmlFor="invite-code" className="text-sm font-medium">
          Invite code
        </label>
        <input
          id="invite-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. ABC123"
          aria-invalid={!!codeError}
          aria-describedby={codeError ? "invite-code-error" : undefined}
          className="flex-1 rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={lookingUp || !code.trim()}
          className="rounded-control bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        >
          Join with code
        </button>
        {codeError && (
          <p
            id="invite-code-error"
            role="alert"
            className="text-sm text-danger"
          >
            {codeError}
          </p>
        )}
      </form>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Filter by role</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRIMARY_ROLES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={role === candidate}
              onClick={() => toggleRole(candidate)}
              className={cn(
                "rounded-control border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                role === candidate
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-surface hover:bg-elevated"
              )}
            >
              {candidate}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-6">
        {!result ? (
          <p className="text-sm text-muted-foreground">Loading teams...</p>
        ) : result.items.length === 0 ? (
          <EmptyState
            title="No open teams"
            description={
              role
                ? `No open teams need a ${role.toLowerCase()} right now.`
                : "No open teams are recruiting right now. Form your own and get building."
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.items.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/teams/${team.id}`}
                  className="flex flex-col gap-2 rounded-card border border-border bg-card p-5 shadow-sm transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <span className="text-lg font-semibold">{team.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {team.memberCount} member{team.memberCount === 1 ? "" : "s"}{" "}
                    · Looking for: {team.rolesNeeded.join(", ")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {result && result.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => void load(page - 1, role)}
              className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {result.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= result.totalPages}
              onClick={() => void load(page + 1, role)}
              className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
