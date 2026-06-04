import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "vitest";
import { createOutputAssetsConfig, createRuntimeAssetsConfig } from "../assets";
import { resolvePluginConfig } from "../config";

describe("assets config", () => {
  test("connects worker assets to web environment output", ({ expect }) => {
    const root = mkdtempSync(join(tmpdir(), "rsbuild-cloudflare-"));
    const workerOutputDirectory = join(root, "dist/test_worker");
    const assetsDirectory = join(root, "dist/client");
    const resolvedConfig = resolvePluginConfig(
      {
        config: {
          name: "test-worker",
          main: "src/index.ts",
          compatibility_date: "2025-01-01",
          assets: {
            not_found_handling: "single-page-application",
          },
        },
        persistState: false,
      },
      { root },
    );
    const environments = {
      web: {
        name: "web",
        target: "web",
        distPath: assetsDirectory,
      },
      [resolvedConfig.environmentName]: {
        name: resolvedConfig.environmentName,
        target: "web-worker",
        distPath: workerOutputDirectory,
      },
    };

    expect(createOutputAssetsConfig(resolvedConfig, workerOutputDirectory, environments)).toEqual({
      directory: "../client",
      not_found_handling: "single-page-application",
    });
    expect(createRuntimeAssetsConfig(resolvedConfig, environments)).toEqual({
      directory: assetsDirectory,
      not_found_handling: "single-page-application",
    });
  });
});
