import { afterEach, describe, expect, it, vi } from "vitest";
import {
  countCommitsByDay,
  fetchCommitActivity,
  fetchRepoInfo,
  parseGithubRepo,
  ENABLE_GITHUB_COMMIT_GRAPH,
} from "@/lib/github";

describe("parseGithubRepo", () => {
  it("parses a plain repo url", () => {
    expect(parseGithubRepo("https://github.com/10xdev4u-alt/squadup")).toEqual({
      owner: "10xdev4u-alt",
      repo: "squadup",
    });
  });

  it("strips www, trailing slashes, and file paths", () => {
    expect(
      parseGithubRepo("https://www.github.com/acme/widget/blob/main/readme.md")
    ).toEqual({ owner: "acme", repo: "widget" });
    expect(parseGithubRepo("https://github.com/acme/widget/")).toEqual({
      owner: "acme",
      repo: "widget",
    });
  });

  it("rejects non-repo and lookalike urls", () => {
    expect(parseGithubRepo("https://github.com/")).toBeNull();
    expect(
      parseGithubRepo("https://github.com.evil.example/acme/widget")
    ).toBeNull();
    expect(parseGithubRepo("https://notgithub.com/acme/widget")).toBeNull();
  });
});

describe("countCommitsByDay", () => {
  const commits = [
    { commit: { author: { date: "2026-08-14T10:00:00Z" } } },
    { commit: { author: { date: "2026-08-14T11:00:00Z" } } },
    { commit: { author: { date: "2026-08-12T09:00:00Z" } } },
  ];

  it("buckets commits into 0-filled daily counts", () => {
    // today = 2026-08-14 -> bucket 0 = today, 2 = two days ago
    const counts = countCommitsByDay(commits, 14, "2026-08-14T12:00:00Z");
    expect(counts).toHaveLength(14);
    expect(counts[0]).toBe(2);
    expect(counts[2]).toBe(1);
    expect(counts[1]).toBe(0);
  });

  it("is fully zeroed when there are no commits", () => {
    expect(countCommitsByDay([], 7, "2026-08-14T12:00:00Z")).toEqual([
      0, 0, 0, 0, 0, 0, 0,
    ]);
  });
});

describe("github feature flag", () => {
  it("exposes the commit-graph flag for one-place toggling", () => {
    expect(typeof ENABLE_GITHUB_COMMIT_GRAPH).toBe("boolean");
  });
});

describe("fetchRepoInfo", () => {
  const repoResponse = {
    description: "SquadUp — find your squad",
    stargazers_count: 12,
    language: "TypeScript",
    html_url: "https://github.com/10xdev4u-alt/squadup",
  };

  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("fetches repo metadata and maps it to a DTO", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => repoResponse,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const info = await fetchRepoInfo("https://github.com/10xdev4u-alt/squadup");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/10xdev4u-alt/squadup"
    );
    expect(info).toEqual({
      owner: "10xdev4u-alt",
      repo: "squadup",
      description: "SquadUp — find your squad",
      stars: 12,
      language: "TypeScript",
      url: "https://github.com/10xdev4u-alt/squadup",
    });
  });

  it("returns null on a rate-limit response (403) — never throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) }))
    );

    await expect(
      fetchRepoInfo("https://github.com/acme/widget")
    ).resolves.toBeNull();
  });

  it("returns null on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("offline")))
    );

    await expect(
      fetchRepoInfo("https://github.com/acme/widget")
    ).resolves.toBeNull();
  });

  it("serves the cache on repeat calls without re-fetching", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => repoResponse,
    }));
    vi.stubGlobal("fetch", fetchMock);

    await fetchRepoInfo("https://github.com/10xdev4u-alt/squadup");
    await fetchRepoInfo("https://github.com/10xdev4u-alt/squadup");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchCommitActivity", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("returns 14 daily commit counts", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => [
          { commit: { author: { date: "2026-08-14T10:00:00Z" } } },
        ],
      }))
    );

    const counts = await fetchCommitActivity("https://github.com/acme/widget");

    expect(counts).toHaveLength(14);
    expect(counts?.[0]).toBeGreaterThanOrEqual(1);
  });

  it("returns null when the API is rate-limited", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) }))
    );

    await expect(
      fetchCommitActivity("https://github.com/acme/widget")
    ).resolves.toBeNull();
  });
});
