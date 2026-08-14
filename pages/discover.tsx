import Layout from "@/components/Layout";
import EmptyState from "@/components/empty-state";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function Discover() {
  useRequireAuth();

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Discover</h1>
      <div className="mt-6">
        <EmptyState
          title="No squads to swipe yet"
          description="Teams appear here as they finish onboarding. Invite a friend to get the first one on the board."
        />
      </div>
    </Layout>
  );
}
