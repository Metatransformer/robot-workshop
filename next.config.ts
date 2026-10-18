import type { NextConfig } from "next";
const config: NextConfig = {
  serverExternalPackages: ["unpdf", "@agentclientprotocol/sdk"],
  devIndicators: false,
  outputFileTracingExcludes: { "/*": [".workshop/**/*", "test-results/**/*", "playwright-report/**/*"] },
};
export default config;
