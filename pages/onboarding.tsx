import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { api, getApiErrorMessage, getCurrentUser } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { validateProfile, type ProfileErrors } from "@/lib/validate-profile";

export default function Onboarding() {
  const router = useRouter();
  const user = getCurrentUser(getClient());

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const { errors: nextErrors } = validateProfile({ name, bio, githubUrl });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!user) return;

    setBusy(true);
    try {
      await api().users.updateProfile(user.id, {
        name: name.trim(),
        bio: bio.trim(),
        githubUrl: githubUrl.trim() || null,
      });
      router.replace("/onboarding/skills");
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Set up your profile</h1>
      <p className="mt-2 text-muted-foreground">
        Step 1 of 2 — tell your future squad who you are.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex max-w-md flex-col gap-5"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Full name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-control border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <span className="text-sm text-danger">{errors.name}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="rounded-control border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            aria-invalid={!!errors.bio}
          />
          {errors.bio && (
            <span className="text-sm text-danger">{errors.bio}</span>
          )}
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">GitHub URL</span>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/you"
            className="rounded-control border border-input bg-background px-3 py-2 outline-none focus:border-primary"
            aria-invalid={!!errors.githubUrl}
          />
          {errors.githubUrl && (
            <span className="text-sm text-danger">{errors.githubUrl}</span>
          )}
        </label>

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-control bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving..." : "Continue to skills"}
        </button>
      </form>
    </Layout>
  );
}
