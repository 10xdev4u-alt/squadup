// ============================================================================
// Onboarding profile validation — pure, React-free. Mirrors §8 schema limits
// (name ≤ 100 required, bio ≤ 500, githubUrl http(s) URL optional).
// ============================================================================

export interface ProfileFormValues {
  name: string;
  bio: string;
  githubUrl: string;
}

export interface ProfileErrors {
  name?: string;
  bio?: string;
  githubUrl?: string;
}

export const NAME_MAX = 100;
export const BIO_MAX = 500;

const GITHUB_URL_RE = /^https?:\/\/.+/;

export function validateProfile(values: ProfileFormValues): {
  errors: ProfileErrors;
} {
  const errors: ProfileErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = "Your name is required.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Your name must be ${NAME_MAX} characters or fewer.`;
  }

  if (values.bio.length > BIO_MAX) {
    errors.bio = `Your bio must be ${BIO_MAX} characters or fewer.`;
  }

  const githubUrl = values.githubUrl.trim();
  if (githubUrl && !GITHUB_URL_RE.test(githubUrl)) {
    errors.githubUrl = "Enter a valid URL starting with http:// or https://.";
  }

  return { errors };
}
