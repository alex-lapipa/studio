/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),
  env: {
    NEXT_PUBLIC_GIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "local",
    NEXT_PUBLIC_GIT_REF: process.env.VERCEL_GIT_COMMIT_REF || "local",
    NEXT_PUBLIC_DEPLOYMENT_URL: process.env.VERCEL_URL || "local",
  },
};
export default nextConfig;
