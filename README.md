# `rsbuild-cloudflare`

Experimental Cloudflare Workers plugin for [Rsbuild](https://rsbuild.rs/).

The plugin reads Wrangler configuration, configures an Rsbuild Worker
environment, serves development requests through Miniflare, and emits deployable
Worker output.

## Installation

```sh
pnpm add -D rsbuild-cloudflare @rsbuild/core wrangler
```

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

For applications with a browser/client environment, add Wrangler `assets`
options to the Worker config. The plugin fills `assets.directory` with the
client build output:

```ts
cloudflare({
  config: {
    name: "my-app",
    main: "worker/index.ts",
    compatibility_date: "2025-01-01",
    assets: {
      not_found_handling: "single-page-application",
    },
  },
});
```

## Environment Variables

- `CLOUDFLARE_ENV` selects a Wrangler environment.
- `CLOUDFLARE_RSBUILD_WRANGLER_CONFIG_PATH` sets the Wrangler config path.

## Development

`rsbuild dev` builds the Worker environment to disk and serves requests through
Miniflare. The Worker receives the same module output that Rsbuild writes for a
production build, so development and deploy output stay aligned.

Local persistence is enabled by default. Disable it with `persistState: false`
or provide a custom persistence directory:

```ts
cloudflare({
  persistState: {
    path: ".wrangler/state",
  },
});
```

Set `inspectorPort: false` to disable the Worker inspector, or pass a port
number to pin it.

## Build Output

`rsbuild build` emits a Worker environment under
`dist/<worker_environment_name>`. The output includes:

- bundled module Worker files
- a generated `wrangler.json` with `main` pointing at the built Worker entry
- a generated `assets.directory` when the project has a web-target Rsbuild
  environment or the Worker config provides an explicit assets directory
- `.wrangler/deploy/config.json` so `wrangler deploy` can discover the generated
  config

After building, deploy from the project root with:

```sh
wrangler deploy
```

## Examples

- `examples/basic-worker` builds a plain Worker entrypoint with inline Worker
  config.
- `examples/react-app` builds a React browser app and Cloudflare Worker API in
  one Rsbuild project without a `wrangler.json` file.

## Current Scope

This package is the Rsbuild equivalent of the Cloudflare Vite plugin's core
Worker loop:

- Wrangler config resolution through Wrangler's unstable integration APIs
- Rsbuild Worker environment output targeting module Workers
- `wrangler.json` emission beside the compiled Worker entry
- `.wrangler/deploy/config.json` emission for Wrangler deploy discovery
- static asset output discovery for web-target Rsbuild environments
- Miniflare-backed development middleware
