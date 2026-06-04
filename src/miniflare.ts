import * as fs from "node:fs";
import * as path from "node:path";
import { Log, LogLevel, Miniflare } from "miniflare";
import * as wrangler from "wrangler";
import { createRuntimeAssetsConfig } from "./assets";
import type { AssetsEnvironments } from "./assets";
import type { PersistState, ResolvedPluginConfig } from "./config";
import type {
  MiniflareOptions,
  Request as MiniflareRequest,
  Response as MiniflareResponse,
  WorkerOptions,
} from "miniflare";
import type { SourcelessWorkerOptions, Unstable_Config } from "wrangler";

type RemoteProxySessionData = Awaited<
  ReturnType<typeof wrangler.maybeStartOrUpdateRemoteProxySession>
>;
type RemoteProxyConnectionString =
  NonNullable<RemoteProxySessionData>["session"]["remoteProxyConnectionString"];

export class MiniflareController {
  #miniflare: Miniflare | undefined;
  #remoteProxySessionData: RemoteProxySessionData = null;

  async startOrUpdate(
    resolvedConfig: ResolvedPluginConfig,
    workerOutputDirectory: string,
    environments?: AssetsEnvironments,
  ): Promise<void> {
    this.#remoteProxySessionData = await maybeStartRemoteProxySession(
      resolvedConfig,
      this.#remoteProxySessionData,
    );
    const options = createMiniflareOptions(
      resolvedConfig,
      workerOutputDirectory,
      environments,
      this.#remoteProxySessionData?.session.remoteProxyConnectionString,
    );

    if (this.#miniflare) {
      await this.#miniflare.setOptions(options);
    } else {
      this.#miniflare = new Miniflare(options);
    }
  }

  async dispatchFetch(request: MiniflareRequest): Promise<MiniflareResponse> {
    if (!this.#miniflare) {
      return new Response("Cloudflare Worker is still compiling.", {
        status: 503,
      }) as MiniflareResponse;
    }

    return this.#miniflare.dispatchFetch(request, { redirect: "manual" });
  }

  async dispose(): Promise<void> {
    await this.#miniflare?.dispose();
    await this.#remoteProxySessionData?.session.dispose();
    this.#miniflare = undefined;
    this.#remoteProxySessionData = null;
  }
}

export function createMiniflareOptions(
  resolvedConfig: ResolvedPluginConfig,
  workerOutputDirectory: string,
  environments?: AssetsEnvironments,
  remoteProxyConnectionString?: RemoteProxyConnectionString,
): MiniflareOptions {
  const main = path.join(workerOutputDirectory, "index.js");
  const runtimeConfig: Unstable_Config = {
    ...resolvedConfig.workerConfig,
    main,
    no_bundle: true,
    rules: [{ type: "ESModule", globs: ["**/*.js", "**/*.mjs"] }],
    assets: createRuntimeAssetsConfig(resolvedConfig, environments),
  };
  const miniflareWorkerOptions = wrangler.unstable_getMiniflareWorkerOptions(
    runtimeConfig,
    resolvedConfig.cloudflareEnv,
    remoteProxyConnectionString ? { remoteProxyConnectionString } : undefined,
  );
  const { modulesRules, ...workerOptions } = miniflareWorkerOptions.workerOptions;
  const worker = {
    ...workerOptions,
    name: workerOptions.name ?? resolvedConfig.workerConfig.name,
    ...getWorkerModules(main, modulesRules),
  } as WorkerOptions;

  return {
    log: new Log(LogLevel.WARN),
    inspectorPort:
      resolvedConfig.inspectorPort === false ? undefined : resolvedConfig.inspectorPort,
    defaultPersistRoot: getPersistenceRoot(resolvedConfig.root, resolvedConfig.persistState),
    telemetry: { enabled: false },
    workers: [worker, ...miniflareWorkerOptions.externalWorkers],
  };
}

async function maybeStartRemoteProxySession(
  resolvedConfig: ResolvedPluginConfig,
  previousSessionData: RemoteProxySessionData,
): Promise<RemoteProxySessionData> {
  if (!resolvedConfig.remoteBindings) {
    return null;
  }

  const bindings =
    wrangler.unstable_convertConfigBindingsToStartWorkerBindings(resolvedConfig.workerConfig) ?? {};

  return wrangler.maybeStartOrUpdateRemoteProxySession(
    {
      name: resolvedConfig.workerConfig.name,
      bindings,
      account_id: resolvedConfig.workerConfig.account_id,
    },
    previousSessionData,
  );
}

function getWorkerModules(
  main: string,
  modulesRules: SourcelessWorkerOptions["modulesRules"],
): Pick<WorkerOptions, "rootPath" | "modules"> {
  const rootPath = path.dirname(main);
  const entryPath = path.basename(main);
  const rules = modulesRules ?? [];

  return {
    rootPath,
    modules: [
      {
        type: "ESModule",
        path: entryPath,
      } as const,
      ...getAdditionalModulePaths(rootPath, entryPath, rules).map((modulePath) => ({
        type: "ESModule" as const,
        path: modulePath,
      })),
    ],
  };
}

function getAdditionalModulePaths(
  rootPath: string,
  entryPath: string,
  modulesRules: NonNullable<SourcelessWorkerOptions["modulesRules"]>,
): string[] {
  const hasModuleRule = modulesRules.some(({ type }) => type === "ESModule");
  if (!hasModuleRule || !fs.existsSync(rootPath)) {
    return [];
  }

  return listFiles(rootPath).filter(
    (modulePath) =>
      modulePath !== entryPath && (modulePath.endsWith(".js") || modulePath.endsWith(".mjs")),
  );
}

function listFiles(rootPath: string, currentPath = ""): string[] {
  const absolutePath = path.join(rootPath, currentPath);
  return fs.readdirSync(absolutePath, { withFileTypes: true }).flatMap((dirent) => {
    const modulePath = path.join(currentPath, dirent.name);
    if (dirent.isDirectory()) {
      return listFiles(rootPath, modulePath);
    }
    return dirent.isFile() ? [modulePath] : [];
  });
}

function getPersistenceRoot(root: string, persistState: PersistState): string | undefined {
  if (persistState === false) {
    return;
  }

  return path.resolve(
    root,
    typeof persistState === "object" ? persistState.path : ".wrangler/state",
    "v3",
  );
}
