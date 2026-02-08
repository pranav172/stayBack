import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
};

// Wrap with Sentry for error tracking
export default withSentryConfig(nextConfig, {
  // Sentry organization and project (from environment)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only show verbose output in CI
  silent: !process.env.CI,
  
  // Upload more source maps for better stack traces
  widenClientFileUpload: true,
  
  // Source map settings
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
