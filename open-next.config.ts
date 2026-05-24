import defaultTemplate from "@opennextjs/cloudflare/templates/default";

const config = {
  default: {
    runtime: "edge",
    plugins: ["@opennextjs/cloudflare/plugins/kv-cache"],
  },
  middleware: {
    runtime: "edge",
  },
};

export default config;
