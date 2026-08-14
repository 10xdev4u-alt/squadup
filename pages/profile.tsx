// ============================================================================
// Profile edit — Flow 1 "edit own profile". Only client-owned fields
// (name/bio/githubUrl) are editable here; id/collegeId/status stay
// server-owned per §8. Skills + primary role are edited in onboarding.
// ============================================================================

import { useState } from "react";
import Avatar from "@/components/avatar";
import Layout from "@/components/Layout";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import { getClient } from "@/lib/api/client";
import { getCurrentUser } from "@/lib/api/session";
import { validateProfile } from "@/lib/validate-profile";
import type { ProfileErrors } from "@/lib/validate-profile";

export default function ProfilePage() {
  useRequireAuth();
  const me = getCurrentUser(getClient());

  const [name, setName] = useState(me?.name ?? "");
  const [bio, setBio] = useState(me?.bio ?? "");
  const [githubUrl, setGithubUrl] = useState(me?.githubUrl ?? "");
  const [errors, setErrors] = useState<ProfileErrors>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    setSaved(false);
    const { errors: nextErrors } = validateProfile({ name, bio, githubUrl });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !me) return;

    setSaving(true);
    try {
      await api().users.updateProfile(me.id, {
        name: name.trim(),
        bio: bio.trim(),
        githubUrl: githubUrl.trim() || null,
      });
      setSaved(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      {" "}
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="flex items-center gap-4">
          <Avatar name={me?.name ?? ""} src={me?.avatar ?? null} size="lg" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit Profile
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your profile fresh so the deck and teams know what you bring.
            </p>
          </div>
        </div>

        {saved && (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 rounded-card border border-success/40 bg-card px-4 py-3 text-sm font-medium"
          >
            Profile saved.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-6 text-sm text-danger">
            {error}
          </p>
        )}

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <div>
            <label htmlFor="profile-name" className="block text-sm font-medium">
              Full name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "profile-name-error" : undefined}
              className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {errors.name && (
              <span id="profile-name-error" className="text-sm text-danger">
                {errors.name}
              </span>
            )}
          </div>

          <div>
            <label htmlFor="profile-bio" className="block text-sm font-medium">
              Bio
            </label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? "profile-bio-error" : undefined}
              className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {errors.bio && (
              <span id="profile-bio-error" className="text-sm text-danger">
                {errors.bio}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="profile-github"
              className="block text-sm font-medium"
            >
              GitHub URL
            </label>
            <input
              id="profile-github"
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/you"
              aria-invalid={!!errors.githubUrl}
              aria-describedby={
                errors.githubUrl ? "profile-github-error" : undefined
              }
              className="mt-1 w-full rounded-control border border-border bg-surface px-4 py-2 text-sm focus:border-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {errors.githubUrl && (
              <span id="profile-github-error" className="text-sm text-danger">
                {errors.githubUrl}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-control bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </div>
    </Layout>
  );
}
