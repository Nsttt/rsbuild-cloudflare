import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { cloudflare } from "rsbuild-cloudflare";

export default defineConfig({
  plugins: [
    pluginReact(),
    cloudflare({
      config: {
        name: "rsbuild-cloudflare-react-app",
        main: "worker/index.ts",
        compatibility_date: "2025-01-01",
        vars: {
          MESSAGE: "hello from a React Rsbuild app",
        },
      },
      inspectorPort: false,
      persistState: false,
    }),
  ],
  html: {
    title: "Rsbuild Cloudflare React",
  },
  environments: {
    web: {
      source: {
        entry: {
          index: "./src/main.tsx",
        },
      },
      output: {
        target: "web",
        distPath: {
          root: "dist/client",
        },
      },
    },
  },
});
