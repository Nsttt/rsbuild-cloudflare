import * as path from "node:path";
import type { ResolvedPluginConfig } from "./config";
import type { EnvironmentContext } from "@rsbuild/core";

type AssetsConfig = NonNullable<ResolvedPluginConfig["workerConfig"]["assets"]>;

export interface AssetsEnvironment {
  name: string;
  distPath: string;
  target: string;
}

export type AssetsEnvironments = Record<string, AssetsEnvironment>;

export function createAssetsEnvironments(
  environments: Record<string, EnvironmentContext> | undefined,
): AssetsEnvironments | undefined {
  if (!environments) {
    return;
  }

  return Object.fromEntries(
    Object.entries(environments).map(([name, environment]) => [
      name,
      {
        name: environment.name,
        distPath: environment.distPath,
        target: environment.config.output.target,
      },
    ]),
  );
}

export function createOutputAssetsConfig(
  resolvedConfig: ResolvedPluginConfig,
  workerOutputDirectory: string,
  environments: AssetsEnvironments | undefined,
): AssetsConfig | undefined {
  const assetsDirectory = getAssetsDirectory(resolvedConfig, environments);
  const assetsConfig = createAssetsConfig(resolvedConfig, assetsDirectory);

  if (!assetsConfig) {
    return;
  }

  return {
    ...assetsConfig,
    ...(assetsDirectory
      ? { directory: normalizePath(path.relative(workerOutputDirectory, assetsDirectory)) }
      : {}),
  };
}

export function createRuntimeAssetsConfig(
  resolvedConfig: ResolvedPluginConfig,
  environments: AssetsEnvironments | undefined,
): AssetsConfig | undefined {
  const assetsDirectory = getAssetsDirectory(resolvedConfig, environments);
  const assetsConfig = createAssetsConfig(resolvedConfig, assetsDirectory);

  if (!assetsConfig) {
    return;
  }

  return {
    ...assetsConfig,
    ...(assetsDirectory ? { directory: assetsDirectory } : {}),
  };
}

function createAssetsConfig(
  resolvedConfig: ResolvedPluginConfig,
  assetsDirectory: string | undefined,
): AssetsConfig | undefined {
  if (!resolvedConfig.workerConfig.assets && !assetsDirectory) {
    return;
  }

  return { ...resolvedConfig.workerConfig.assets };
}

function getAssetsDirectory(
  resolvedConfig: ResolvedPluginConfig,
  environments: AssetsEnvironments | undefined,
): string | undefined {
  const configuredAssetsDirectory = resolvedConfig.workerConfig.assets?.directory;
  if (configuredAssetsDirectory) {
    return path.resolve(resolvedConfig.root, configuredAssetsDirectory);
  }

  const webEnvironment = Object.values(environments ?? {}).find(
    (environment) =>
      environment.name !== resolvedConfig.environmentName && environment.target === "web",
  );

  return webEnvironment?.distPath;
}

function normalizePath(value: string): string {
  return value.split(path.sep).join("/");
}
