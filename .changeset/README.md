# Changesets

Create a changeset for user-facing package changes:

```sh
pnpm changeset
```

Run the release gate:

```sh
pnpm release:check
```

Prepare a release commit:

```sh
pnpm release:version
```

Publish after the release commit is merged:

```sh
pnpm release:publish
```
