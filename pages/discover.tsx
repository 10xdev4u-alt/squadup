import Layout from "@/components/Layout";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function Discover() {
  useRequireAuth();

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Discover</h1>
      <p className="mt-2">Your match deck will appear here.</p>
    </Layout>
  );
}
