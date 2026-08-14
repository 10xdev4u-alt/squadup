import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import PageHeader from "@/components/page-header";
import { api, getApiErrorMessage, getCurrentUser } from "@/lib/api";
import { useRequireAuth } from "@/lib/use-require-auth";
import { getClient } from "@/lib/api/client";
import {
  PRIMARY_ROLES,
  SKILLS,
  type PrimaryRole,
  type Skill,
} from "@/types/squadup";
import {
  MAX_SKILLS,
  validateSkills,
  type SkillsErrors,
} from "@/lib/validate-skills";

export default function OnboardingSkills() {
  useRequireAuth();
  const router = useRouter();
  const user = getCurrentUser(getClient());

  const [skills, setSkills] = useState<Skill[]>([]);
  const [primaryRole, setPrimaryRole] = useState<PrimaryRole | null>(null);
  const [errors, setErrors] = useState<SkillsErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleSkill(skill: Skill) {
    setSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= MAX_SKILLS) {
        return prev;
      }
      return [...prev, skill];
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);

    const { errors: nextErrors } = validateSkills({
      skills,
      primaryRole,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (!user || !primaryRole) return;

    setBusy(true);
    try {
      await api().users.updateProfile(user.id, {
        name: user.name,
        bio: user.bio,
        githubUrl: user.githubUrl,
        skills,
        primaryRole,
      });
      router.replace("/discover");
    } catch (err) {
      setApiError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Pick your skills"
        description={`Step 2 of 2 — choose up to ${MAX_SKILLS} skills and your primary role.`}
      />

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex max-w-lg flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Skills</span>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => {
              const selected = skills.includes(skill);
              const atCap = !selected && skills.length >= MAX_SKILLS;
              return (
                <button
                  key={skill}
                  type="button"
                  aria-pressed={selected}
                  disabled={atCap}
                  aria-describedby={errors.skills ? "skills-error" : undefined}
                  onClick={() => toggleSkill(skill)}
                  className={
                    "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-40 " +
                    (selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground")
                  }
                >
                  {skill}
                </button>
              );
            })}
          </div>
          {errors.skills && (
            <span id="skills-error" className="text-sm text-danger">
              {errors.skills}
            </span>
          )}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Primary role</legend>
          <div className="flex flex-wrap gap-3">
            {PRIMARY_ROLES.map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="primaryRole"
                  value={role}
                  checked={primaryRole === role}
                  aria-describedby={
                    errors.primaryRole ? "primary-role-error" : undefined
                  }
                  onChange={() => setPrimaryRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
          {errors.primaryRole && (
            <span id="primary-role-error" className="text-sm text-danger">
              {errors.primaryRole}
            </span>
          )}
        </fieldset>

        {apiError && <p className="text-sm text-danger">{apiError}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-control bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Saving..." : "Finish and start discovering"}
        </button>
      </form>
    </Layout>
  );
}
