import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fonts, palette, paletteLabels } from "@/lib/tokens";

const swatches = Object.entries(palette) as Array<
  [keyof typeof palette, string]
>;

export default function Design() {
  // Dev-only token reference — never serve the design system in prod (§4.4).
  if (process.env.NODE_ENV === "production") {
    return null;
  }
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Design Tokens</h1>
      <p className="mt-2 text-sm">
        Single source of truth: lib/tokens.ts and the :root CSS variables.
      </p>

      <h2 className="mt-8 text-xl font-semibold">Palette</h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {swatches.map(([key, hex]) => (
          <li key={key} className="flex items-center gap-3">
            <span
              className="inline-block h-10 w-10 rounded-control border border-border"
              style={{ backgroundColor: hex }}
            />
            <span>{paletteLabels[key]}</span>
            <span className="ml-auto font-mono text-sm">{hex}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Typography</h2>
      <ul className="mt-4 space-y-2">
        {Object.values(fonts).map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-xl font-semibold">Primitives</h2>
      <div className="mt-4 space-y-6">
        <div className="flex flex-wrap gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary</Button>
          <Badge variant="success">Success badge</Badge>
        </div>
        <div className="max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Card title</CardTitle>
              <CardDescription>Card description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input id="team-name" placeholder="Team name" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog title</DialogTitle>
                <DialogDescription>Dialog description</DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </Layout>
  );
}
