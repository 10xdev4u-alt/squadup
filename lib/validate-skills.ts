// ============================================================================
// Onboarding skills + role validation — pure, React-free.
// §4A: skill tags from the registry, min 1 max 5, no duplicates. §8:
// primaryRole single-select.
// ============================================================================

import {
  PRIMARY_ROLES,
  SKILLS,
  type PrimaryRole,
  type Skill,
} from "@/types/squadup";

export interface SkillsFormValues {
  skills: Skill[];
  primaryRole: PrimaryRole | null;
}

export interface SkillsErrors {
  skills?: string;
  primaryRole?: string;
}

export const MAX_SKILLS = 5;
export const MIN_SKILLS = 1;

export function validateSkills(values: SkillsFormValues): {
  errors: SkillsErrors;
} {
  const errors: SkillsErrors = {};

  if (values.skills.length < MIN_SKILLS) {
    errors.skills = "Pick at least one skill.";
  } else if (values.skills.length > MAX_SKILLS) {
    errors.skills = `Pick at most ${MAX_SKILLS} skills.`;
  } else if (new Set(values.skills).size !== values.skills.length) {
    errors.skills = "Each skill can only be picked once.";
  } else {
    const unknown = values.skills.find((s) => !SKILLS.includes(s));
    if (unknown) {
      errors.skills = "One of the selected skills is not recognized.";
    }
  }

  if (!values.primaryRole) {
    errors.primaryRole = "Choose your primary role.";
  } else if (!PRIMARY_ROLES.includes(values.primaryRole)) {
    errors.primaryRole = "That role is not recognized.";
  }

  return { errors };
}
