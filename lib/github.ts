// ============================================================================
// GitHub presence (§4B item 4, §4C) — enriches github-type resource cards
// with public repo metadata + a 14-day commit sparkline. Pure helpers first
// (parse/count), then thin fetch wrappers that degrade to null on ANY
// failure (rate limits, network, 404) so the hub never breaks. Cached in
// sessionStorage to stay far under GitHub's 60 req/hr unauthenticated cap.
// ============================================================================

/** One-place toggle for the commit sparkline (issue: behind a feature flag). */
export const ENABLE_GITHUB_COMMIT_GRAPH = true;

const INFO_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const ACTIVITY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

export interface GithubRepoInfo {
  owner: string;
  repo: string;
  description: string;
  stars: number;
  language: string | null;
  url: string;
}

export interface GithubCommit {
  commit?: { author?: { date?: string } };
}

/**
 * Extracts { owner, repo } from a GitHub url. Only accepts real
 * github.com hosts (lookalikes like github.com.evil.example fail), strips
 * www, trailing slashes, and file paths (/blob/..., /issues/...).
 */
export function parseGithubRepo(url: string): {
  owner: string;
  repo: string;
} | null {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname !== "github.com" &&
      parsed.hostname !== "www.github.com"
    ) {
      return null;
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1];
    if (!owner || !repo) return null;
    return { owner: decodeURIComponent(owner), repo: decodeURIComponent(repo) };
  } catch {
    return null;
  }
}

/** Buckets commits into `days` daily counts (index 0 = today, 0-filled). */
export function countCommitsByDay(
  commits: GithubCommit[],
  days: number,
  nowIso = new Date().toISOString()
): number[] {
  const counts = new Array<number>(days).fill(0);
  const now = new Date(nowIso);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  );
  for (const c of commits) {
    const date = c.commit?.author?.date;
    if (!date) continue;
    const d = new Date(date);
    const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const diffDays = Math.round((today - day) / 86_400_000);
    if (diffDays >= 0 && diffDays < days)
      counts[diffDays] = (counts[diffDays] ?? 0) + 1;
  }
  return counts;
}

// ---- sessionStorage cache (browser-only; tests stub fetch and storage) ----

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

function cacheGet<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  try {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // storage unavailable (private mode, SSR) — degrade to no cache
  }
}

async function githubFetch<T>(
  url: string,
  cacheKey: string,
  ttlMs: number
): Promise<T | null> {
  const cached = cacheGet<T>(cacheKey);
  if (cached !== null) return cached;
  try {
    const res = await fetch(url);
    if (!res.ok) return null; // 403 rate-limit, 404, etc — degrade gracefully
    const data = (await res.json()) as T;
    cacheSet(cacheKey, data, ttlMs);
    return data;
  } catch {
    return null;
  }
}

/** Public repo metadata for a github url — null on any failure. */
export async function fetchRepoInfo(
  url: string
): Promise<GithubRepoInfo | null> {
  const parsed = parseGithubRepo(url);
  if (!parsed) return null;
  const { owner, repo } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const data = await githubFetch<Record<string, unknown>>(
    apiUrl,
    `gh:info:${owner}/${repo}`,
    INFO_CACHE_TTL_MS
  );
  if (!data) return null;
  return {
    owner,
    repo,
    description: String(data.description ?? ""),
    stars: Number(data.stargazers_count ?? 0),
    language: data.language ? String(data.language) : null,
    url: String(data.html_url ?? url),
  };
}

/**
 * Last-14-days commit counts for the sparkline — [] when the flag is off,
 * null on any failure (rate limit, network, private repo).
 */
export async function fetchCommitActivity(
  url: string
): Promise<number[] | null> {
  if (!ENABLE_GITHUB_COMMIT_GRAPH) return [];
  const parsed = parseGithubRepo(url);
  if (!parsed) return null;
  const { owner, repo } = parsed;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
  const commits = await githubFetch<GithubCommit[]>(
    apiUrl,
    `gh:activity:${owner}/${repo}`,
    ACTIVITY_CACHE_TTL_MS
  );
  if (!commits) return null;
  return countCommitsByDay(commits, 14);
}
