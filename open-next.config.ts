import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

export default {
  ...config,
  default: {
    ...config.default,
    minify: true,
  },
  // @ts-ignore - The types don't include 'features' but it's supported by OpenNext CLI
  features: {
    splitRoutes: true,
  }
};
