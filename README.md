# `rsbuild-cloudflare`

Experimental Cloudflare Workers plugin for [Rsbuild](https://rsbuild.rs/).

The plugin reads Wrangler configuration, configures an Rsbuild Worker
environment, serves development requests through Miniflare, and emits deployable
Worker output.

```ts
// rsbuild.config.ts

import { defineConfig } from "@rsbuild/core";
import { cloudflare } from "rsbuild-cloudflare";

export default defineConfig({
	plugins: [cloudflare()],
});
```

## Configuration

By default, the plugin reads the project Wrangler config and uses `main` as the
Worker entrypoint.

```ts
import { defineConfig } from "@rsbuild/core";
import { cloudflare } from "rsbuild-cloudflare";

export default defineConfig({
	plugins: [
		cloudflare({
			configPath: "wrangler.json",
			persistState: true,
		}),
	],
});
```

You can also provide a Wrangler config override inline:

```ts
cloudflare({
	config: {
		name: "my-worker",
		main: "src/index.ts",
		compatibility_date: "2025-01-01",
	},
});
```

Inline config can be used without a `wrangler.json` file:

```ts
cloudflare({
	config: {
		name: "my-worker",
		main: "src/index.ts",
		compatibility_date: "2025-01-01",
		vars: {
			MESSAGE: "hello",
		},
	},
});
```

## Environment Variables

- `CLOUDFLARE_ENV` selects a Wrangler environment.
- `CLOUDFLARE_RSBUILD_WRANGLER_CONFIG_PATH` sets the Wrangler config path.

The plugin also honors `CLOUDFLARE_VITE_WRANGLER_CONFIG_PATH` as a migration
fallback.

## Examples

- `examples/basic-worker` builds a plain Worker entrypoint with inline Worker
  config.
- `examples/react-app` builds a React browser app and Cloudflare Worker API in
  one Rsbuild project without a `wrangler.json` file.

## Initial Scope

This package is the Rsbuild equivalent of the Cloudflare Vite plugin's core
Worker loop:

- Wrangler config resolution through Wrangler's unstable integration APIs
- Rsbuild Worker environment output targeting module Workers
- `wrangler.json` emission beside the compiled Worker entry
- `.wrangler/deploy/config.json` emission for Wrangler deploy discovery
- Miniflare-backed development middleware

Full parity with `@cloudflare/vite-plugin` is not included yet. Future work
should extract shared Wrangler/Miniflare config helpers, add assets/static-site
support, add remote binding proxy support, handle framework-specific SSR
integrations, and expand the test matrix with Rsbuild fixtures.
