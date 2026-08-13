import type { AppProps } from "next/app";
import { inter, jetbrainsMono, spaceGrotesk } from "@/lib/fonts";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen font-sans`}
    >
      <Component {...pageProps} />
    </div>
  );
}
