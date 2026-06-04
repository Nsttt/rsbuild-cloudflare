import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRsbuild } from "@rsbuild/core";
import { describe, test } from "vitest";
import { cloudflare } from "../index";

describe("cloudflare", () => {
  test("builds a worker environment and emits wrangler config", async ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), "rsbuild-cloudflare-"));
    await mkdir(join(root, "src"), { recursive: true });
    writeFileSync(
      join(root, "src/index.ts"),
      `export default { fetch() { return new Response("ok"); } };`,
    );
    writeFileSync(
      join(root, "wrangler.json"),
      JSON.stringify({
        name: "test-worker",
        main: "src/index.ts",
        compatibility_date: "2025-01-01",
      }),
    );

    const rsbuild = await createRsbuild({
      cwd: root,
      config: {
        plugins: [
          cloudflare({
            configPath: "wrangler.json",
            persistState: false,
            inspectorPort: false,
          }),
        ],
      },
    });

    await rsbuild.build();

    const workerOutDir = join(root, "dist/test_worker");
    expect(existsSync(join(workerOutDir, "index.js"))).toBe(true);
    expect(readFileSync(join(workerOutDir, "index.js"), "utf8")).toContain("export");
    expect(existsSync(join(workerOutDir, "wrangler.json"))).toBe(true);
    const outputConfig = readJson(join(workerOutDir, "wrangler.json"));
    expect(outputConfig).toMatchObject({
      name: "test-worker",
      main: "index.js",
      no_bundle: true,
    });
    expect(outputConfig).not.toHaveProperty("configPath");
    expect(outputConfig).not.toHaveProperty("userConfigPath");
    expect(outputConfig).not.toHaveProperty("topLevelName");
    expect(outputConfig).not.toHaveProperty("definedEnvironments");
    expect(outputConfig).not.toHaveProperty("targetEnvironment");
    expect(existsSync(join(root, ".wrangler/deploy/config.json"))).toBe(true);
  });

  test("connects worker assets to a web environment output", async ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), "rsbuild-cloudflare-"));
    await mkdir(join(root, "src"), { recursive: true });
    await mkdir(join(root, "worker"), { recursive: true });
    writeFileSync(join(root, "src/main.ts"), `document.body.textContent = "client";`);
    writeFileSync(
      join(root, "worker/index.ts"),
      `export default { fetch() { return new Response("worker"); } };`,
    );

    const rsbuild = await createRsbuild({
      cwd: root,
      config: {
        plugins: [
          cloudflare({
            config: {
              name: "assets-worker",
              main: "worker/index.ts",
              compatibility_date: "2025-01-01",
              assets: {
                not_found_handling: "single-page-application",
              },
            },
            persistState: false,
            inspectorPort: false,
          }),
        ],
        environments: {
          web: {
            source: {
              entry: {
                index: "./src/main.ts",
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
      },
    });

    await rsbuild.build();

    const workerOutDir = join(root, "dist/assets_worker");
    const outputConfig = readJson(join(workerOutDir, "wrangler.json"));

    expect(existsSync(join(root, "dist/client/index.html"))).toBe(true);
    expect(outputConfig).toMatchObject({
      name: "assets-worker",
      main: "index.js",
      assets: {
        directory: "../client",
        not_found_handling: "single-page-application",
      },
    });
  });
});

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}
