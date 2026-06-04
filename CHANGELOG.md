# rsbuild-cloudflare

## 0.1.0

Initial experimental release.

- Add the `cloudflare()` Rsbuild plugin for module Worker builds.
- Resolve Wrangler config from files, inline plugin options, or environment.
- Emit deployable Worker output and Wrangler deploy discovery config.
- Discover web-target Rsbuild output for Wrangler static assets.
- Serve development requests through Miniflare-backed middleware.
- Add basic Worker and React app examples.
