import Layout from "@/components/Layout";

// Placeholder — the real skills + role step lands in I9. Keeping the route
// alive so the profile step's forward navigation never 404s.
export default function OnboardingSkills() {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Pick your skills</h1>
      <p className="mt-2">
        Skills and role selection land in the next foundation sprint.
      </p>
    </Layout>
  );
}
