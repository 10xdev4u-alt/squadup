import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Next.js does not auto-inject the viewport — without it mobile
            browsers render at desktop width and zoom out (§3.4). */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#16161a" />
        <meta
          name="description"
          content="SquadUp — find your SIH teammates and ship together."
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
