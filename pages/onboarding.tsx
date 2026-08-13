import Layout from "@/components/Layout";

// Placeholder — the real multi-step onboarding (profile -> skills -> role)
// lands in I8 (profile step) and I9 (skills step). Keeping the route alive so
// the post-verify redirect never 404s.
export default function Onboarding() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Set up your profile</h1>
      <p className="mt-2">
        Onboarding steps land in the next foundation sprint.
      </p>
    </Layout>
  );
}
