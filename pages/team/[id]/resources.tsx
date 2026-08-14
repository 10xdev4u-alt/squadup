// ============================================================================
// Resource hub — the team's universal link space (§4C). Paste any link: the
// server derives the type + embeddable flag; embeddable links (Figma,
// Excalidraw) render as live iframe previews, everything else as a clean
// link card with an Open button. Members-only, paginated, realtime-free
// (a refresh is fine for a link board — keeps the surface small).
// ============================================================================

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { fetchCommitActivity, fetchRepoInfo } from "@/lib/github";
import type { GithubRepoInfo } from "@/lib/github";
import type { Resource } from "@/types/squadup";

function GithubCard({ resource }: { resource: Resource }) {
  const [info, setInfo] = useState<GithubRepoInfo | null>(null);
  const [activity, setActivity] = useState<number[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      fetchRepoInfo(resource.url),
      fetchCommitActivity(resource.url),
    ]).then(([repo, commits]) => {
      if (cancelled) return;
      setInfo(repo);
      setActivity(commits);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [resource.url]);

  // Graceful degradation: any failure -> plain link card, hub never breaks.
  if (loaded && !info) {
    return (
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Open
        <span aria-hidden="true">{"\u2197"}</span>
      </a>
    );
  }

  const max = activity ? Math.max(1, ...activity) : 0;

  return (
    <div className="mt-3">
      {info && (
        <div>
          <p className="text-sm text-muted-foreground">{info.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {info.language && (
              <Badge variant="secondary">{info.language}</Badge>
            )}
            <span aria-label={`${info.stars} stars`}>
              {"\u2605"} {info.stars}
            </span>
            <a
              href={info.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Open
              <span aria-hidden="true"> {"\u2197"}</span>
            </a>
          </div>
        </div>
      )}
      {activity && activity.length > 0 && (
        <div
          role="img"
          aria-label="Commit activity in the last 14 days"
          className="mt-3 flex h-10 items-end gap-1"
        >
          {activity.map((count, i) => (
            <span
              key={i}
              title={`${count} commit${count === 1 ? "" : "s"}`}
              className={`w-2 rounded-sm ${
                count > 0 ? "bg-primary" : "bg-muted"
              }`}
              style={{
                height: `${count > 0 ? Math.max(12, (count / max) * 100) : 4}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResourcesPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");

  const [resources, setResources] = useState<Resource[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      try {
        const result = await api().resources.fetchResources(teamId, p);
        setResources(result.items);
        setTotalPages(result.totalPages);
        setPage(result.page);
        setError(null);
      } catch (err) {
        setError(getApiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [teamId]
  );

  useEffect(() => {
    if (!teamId) return;
    load(1);
  }, [teamId, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await api().resources.createResource(teamId, {
        url: url.trim(),
        title: title.trim(),
      });
      setResources((prev) => [created, ...prev]);
      setUrl("");
      setTitle("");
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Resource Hub
            </h1>
          </div>
          <Link
            href={`/team/${teamId}`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to dashboard
          </Link>
        </header>

        <form
          onSubmit={handleCreate}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-card border border-border bg-card p-4"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Link URL
            </span>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://figma.com/file/... or any link"
              className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Design v1"
              className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving || !url.trim() || !title.trim()}
            className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Add Resource
          </button>
          {formError && (
            <p role="alert" className="w-full text-xs text-destructive">
              {formError}
            </p>
          )}
        </form>

        {loading ? (
          <div className="mt-8 space-y-4">
            <div className="h-40 animate-pulse rounded-card bg-muted" />
            <div className="h-16 animate-pulse rounded-card bg-muted" />
          </div>
        ) : error && resources.length === 0 ? (
          <div className="mt-8 rounded-card border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="mt-8 rounded-card border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm font-medium">No resources yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share the first link for your team.
            </p>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="rounded-card border border-border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold">{resource.title}</h2>
                  <Badge variant="secondary">{resource.type}</Badge>
                </div>
                {resource.embeddable ? (
                  <iframe
                    title={resource.title}
                    src={resource.url}
                    className="mt-3 h-96 w-full rounded-control border border-border bg-background"
                    loading="lazy"
                  />
                ) : resource.type === "github" ? (
                  <GithubCard resource={resource} />
                ) : (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open
                    <span aria-hidden="true">{"\u2197"}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <nav
            aria-label="Resource pages"
            className="mt-8 flex items-center justify-center gap-3"
          >
            <button
              type="button"
              onClick={() => load(page - 1)}
              disabled={page <= 1}
              className="rounded-control border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => load(page + 1)}
              disabled={page >= totalPages}
              className="rounded-control border border-border px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </Layout>
  );
}
