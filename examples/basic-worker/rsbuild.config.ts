import { defineConfig } from "@rsbuild/core";
import { cloudflare } from "rsbuild-cloudflare";

export default defineConfig({
  plugins: [
    cloudflare({
      config: {
        name: "rsbuild-cloudflare-basic-worker",
        main: "src/index.ts",
        compatibility_date: "2025-01-01",
        vars: {
          MESSAGE: "hello-from-rsbuild",
        },
      },
      inspectorPort: false,
      persistState: false,
    }),
  ],
});
