/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // §8.7 — don't advertise the framework in X-Powered-By.
  poweredByHeader: false,
};

export default nextConfig;
