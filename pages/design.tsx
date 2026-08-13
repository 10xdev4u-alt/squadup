import Layout from "@/components/Layout";
import { fonts, palette, paletteLabels } from "@/lib/tokens";

const swatches = Object.entries(palette) as Array<
  [keyof typeof palette, string]
>;

export default function Design() {
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
    </Layout>
  );
}
