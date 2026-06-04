import { defineConfig } from "@rsbuild/core";
import { cloudflare } from "rsbuild-cloudflare";

export default defineConfig({
	plugins: [
		cloudflare({
			configPath: "wrangler.json",
			inspectorPort: false,
			persistState: false,
		}),
	],
});
