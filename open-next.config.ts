import { defineCloudflareConfig } from "@opennextjs/cloudflare";

<<<<<<< HEAD
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
=======
export default defineCloudflareConfig({
  // OpenNext built-in helper automatically generates the correct structural defaults
});
>>>>>>> 9c339c352cb7c2baa97cb98ddc23abe476d3d0d7
