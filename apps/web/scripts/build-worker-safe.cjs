const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

const appRoot = process.cwd();
const buildDir = path.join(appRoot, ".open-next", ".build");
const targetFiles = [
  path.join(buildDir, "open-next.config.edge.mjs"),
  path.join(buildDir, "open-next.config.mjs"),
];
const nextDir = path.join(appRoot, ".next");
const standaloneNextDir = path.join(nextDir, "standalone", "apps", "web", ".next");
const placeholderTraceFiles = [
  path.join(nextDir, "next-server.js.nft.json"),
  path.join(nextDir, "server", "app", "_not-found", "page.js.nft.json"),
];
const placeholderRootFiles = [
  path.join(nextDir, "BUILD_ID"),
  path.join(nextDir, "build-manifest.json"),
  path.join(nextDir, "app-build-manifest.json"),
  path.join(nextDir, "required-server-files.json"),
];
const placeholderServerFiles = [
  {
    path: path.join(nextDir, "server", "pages-manifest.json"),
    content: JSON.stringify({ _app: "pages/_app.js", _document: "pages/_document.js", _error: "pages/_error.js" }, null, 2),
  },
  {
    path: path.join(nextDir, "server", "app-paths-manifest.json"),
    content: "{}",
  },
  {
    path: path.join(nextDir, "server", "functions-config-manifest.json"),
    content: JSON.stringify({ version: 1, functions: {} }, null, 2),
  },
  {
    path: path.join(nextDir, "server", "middleware-manifest.json"),
    content: JSON.stringify({ version: 3, middleware: {}, functions: {}, sortedMiddleware: [] }, null, 2),
  },
  {
    path: path.join(nextDir, "server", "server-reference-manifest.json"),
    content: JSON.stringify({ node: {}, edge: {}, encryptionKey: "OPEN_NEXT_WINDOWS_FALLBACK" }, null, 2),
  },
  {
    path: path.join(nextDir, "server", "webpack-runtime.js"),
    content: '"use strict";\nself.__OPEN_NEXT_WEBPACK_RUNTIME__ = true;\n',
  },
];
const placeholderStandaloneServerFiles = [
  {
    path: path.join(standaloneNextDir, "BUILD_ID"),
    sourcePath: path.join(nextDir, "BUILD_ID"),
    content: "OPEN_NEXT_WINDOWS_FALLBACK\n",
  },
  {
    path: path.join(standaloneNextDir, "required-server-files.json"),
    sourcePath: path.join(nextDir, "required-server-files.json"),
    content: JSON.stringify(
      {
        version: 1,
        config: {
          output: "standalone",
          distDir: ".next",
          cleanDistDir: true,
          assetPrefix: "",
          basePath: "",
          amp: {
            canonicalBase: "",
          },
          compress: true,
          devIndicators: false,
          generateEtags: true,
          pageExtensions: ["tsx", "ts", "jsx", "js"],
          poweredByHeader: true,
          reactStrictMode: null,
          trailingSlash: false,
          images: {
            path: "/_next/image",
            loader: "default",
            unoptimized: false,
          },
          experimental: {
            optimizeCss: false,
          },
        },
        appDir: appRoot,
        relativeAppDir: ".",
        files: [
          "BUILD_ID",
          "routes-manifest.json",
          "prerender-manifest.json",
          "server/app-paths-manifest.json",
          "server/functions-config-manifest.json",
          "server/middleware-manifest.json",
          "server/pages-manifest.json",
        ],
        ignore: [],
      },
      null,
      2,
    ),
  },
  {
    path: path.join(standaloneNextDir, "server", "pages-manifest.json"),
    sourcePath: path.join(nextDir, "server", "pages-manifest.json"),
    content: JSON.stringify({ _app: "pages/_app.js", _document: "pages/_document.js", _error: "pages/_error.js" }, null, 2),
  },
  {
    path: path.join(standaloneNextDir, "server", "app-paths-manifest.json"),
    sourcePath: path.join(nextDir, "server", "app-paths-manifest.json"),
    content: "{}",
  },
  {
    path: path.join(standaloneNextDir, "server", "functions-config-manifest.json"),
    sourcePath: path.join(nextDir, "server", "functions-config-manifest.json"),
    content: JSON.stringify({ version: 1, functions: {} }, null, 2),
  },
  {
    path: path.join(standaloneNextDir, "server", "middleware-manifest.json"),
    sourcePath: path.join(nextDir, "server", "middleware-manifest.json"),
    content: JSON.stringify({ version: 3, middleware: {}, functions: {}, sortedMiddleware: [] }, null, 2),
  },
  {
    path: path.join(standaloneNextDir, "server", "webpack-runtime.js"),
    sourcePath: path.join(nextDir, "server", "webpack-runtime.js"),
    content: '"use strict";\nself.__OPEN_NEXT_WEBPACK_RUNTIME__ = true;\n',
  },
  {
    path: path.join(standaloneNextDir, "server", "next-font-manifest.json"),
    sourcePath: path.join(nextDir, "server", "next-font-manifest.json"),
    content: JSON.stringify(
      {
        pages: {},
        app: {},
        appUsingSizeAdjust: false,
        pagesUsingSizeAdjust: false,
      },
      null,
      2,
    ),
  },
  {
    path: path.join(standaloneNextDir, "server", "next-font-manifest.js"),
    sourcePath: path.join(nextDir, "server", "next-font-manifest.js"),
    content: 'self.__NEXT_FONT_MANIFEST="{\"pages\":{},\"app\":{},\"appUsingSizeAdjust\":false,\"pagesUsingSizeAdjust\":false}"',
  },
];
const configContent = `const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
  edgeExternals: ["node:crypto"],
  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
      incrementalCache: "dummy",
      tagCache: "dummy",
      queue: "dummy",
    },
  },
};

export default config;
`;
const placeholderTraceContent = JSON.stringify({
  version: 1,
  files: [],
}, null, 2);
const placeholderRootContent = JSON.stringify({
  pages: {},
  rootMainFiles: [],
}, null, 2);
const placeholderRequiredServerFilesContent = JSON.stringify(
  {
    version: 1,
    config: {
      output: "standalone",
      distDir: ".next",
      cleanDistDir: true,
      assetPrefix: "",
      basePath: "",
      amp: {
        canonicalBase: "",
      },
      compress: true,
      devIndicators: false,
      generateEtags: true,
      pageExtensions: ["tsx", "ts", "jsx", "js"],
      poweredByHeader: true,
      reactStrictMode: null,
      trailingSlash: false,
      images: {
        path: "/_next/image",
        loader: "default",
        unoptimized: false,
      },
      experimental: {
        optimizeCss: false,
      },
    },
    appDir: appRoot,
    relativeAppDir: ".",
    files: [
      "BUILD_ID",
      "routes-manifest.json",
      "prerender-manifest.json",
      "server/app-paths-manifest.json",
      "server/functions-config-manifest.json",
      "server/middleware-manifest.json",
      "server/pages-manifest.json",
    ],
    ignore: [],
  },
  null,
  2,
);
const defaultNodeOptions = "--max-old-space-size=12288";
const appServerDir = path.join(nextDir, "server", "app");
const bundleNextDir = path.join(appRoot, ".open-next", "server-functions", "default", "apps", "web", ".next");
const bundledHandlerPath = path.join(appRoot, ".open-next", "server-functions", "default", "apps", "web", "handler.mjs");
const bundledWorkerPath = path.join(appRoot, ".open-next", "worker.js");
const sourceMiddlewarePath = path.join(appRoot, "src", "middleware.ts");

function patchOpenNextHelper() {
  const helperPath = path.join(appRoot, "..", "..", "node_modules", "@opennextjs", "aws", "dist", "build", "helper.js");
  if (!fs.existsSync(helperPath)) {
    return;
  }

  const original = fs.readFileSync(helperPath, "utf8");
  if (original.includes("OPEN_NEXT_WINDOWS_FALLBACK")) {
    return;
  }

  const patched = original.replace(
    'export function copyOpenNextConfig(inputDir, outputDir, isEdge = false) {\n    // Copy open-next.config.mjs\n    fs.copyFileSync(path.join(inputDir, isEdge ? "open-next.config.edge.mjs" : "open-next.config.mjs"), path.join(outputDir, "open-next.config.mjs"));\n}\n',
    `export function copyOpenNextConfig(inputDir, outputDir, isEdge = false) {\n    // OPEN_NEXT_WINDOWS_FALLBACK\n    const filename = isEdge ? "open-next.config.edge.mjs" : "open-next.config.mjs";\n    const preferredSource = path.join(inputDir, filename);\n    const fallbackSource = path.join(process.cwd(), "open-next.config.mjs");\n    const resolvedSource = fs.existsSync(preferredSource) ? preferredSource : fallbackSource;\n    fs.copyFileSync(resolvedSource, path.join(outputDir, "open-next.config.mjs"));\n}\n`,
  );

  fs.writeFileSync(helperPath, patched, "utf8");
}

function patchBuildNextAppReuse() {
  const buildNextAppPath = path.join(appRoot, "..", "..", "node_modules", "@opennextjs", "aws", "dist", "build", "buildNextApp.js");
  if (!fs.existsSync(buildNextAppPath)) {
    return;
  }

  const original = fs.readFileSync(buildNextAppPath, "utf8");
  if (original.includes("OPEN_NEXT_WINDOWS_BUILD_REUSE")) {
    return;
  }

  const withFsImport = original.replace(
    'import cp from "node:child_process";\nimport path from "node:path";\n',
    'import cp from "node:child_process";\nimport fs from "node:fs";\nimport path from "node:path";\n',
  );

  const patched = withFsImport.replace(
    'export function buildNextjsApp(options) {\n    const { config, packager } = options;\n    const command = config.buildCommand ??\n        (["bun", "npm"].includes(packager)\n            ? `${packager} run build`\n            : `${packager} build`);\n    cp.execSync(command, {\n        stdio: "inherit",\n        cwd: path.dirname(options.appPackageJsonPath),\n    });\n}\n',
    `export function buildNextjsApp(options) {\n    const { config, packager } = options;\n    const appRoot = path.dirname(options.appPackageJsonPath);\n    const requiredArtifacts = [\n        path.join(appRoot, ".next", "BUILD_ID"),\n        path.join(appRoot, ".next", "server", "app-paths-manifest.json"),\n        path.join(appRoot, ".next", "server", "pages-manifest.json"),\n    ];\n    if (requiredArtifacts.every((artifact) => fs.existsSync(artifact))) {\n        console.log("OpenNext: reusing existing .next build artifacts."); // OPEN_NEXT_WINDOWS_BUILD_REUSE\n        return;\n    }\n    const command = config.buildCommand ??\n        (["bun", "npm"].includes(packager)\n            ? \`\${packager} run build\`\n            : \`\${packager} build\`);\n    cp.execSync(command, {\n        stdio: "inherit",\n        cwd: appRoot,\n    });\n}\n`,
  );

  fs.writeFileSync(buildNextAppPath, patched, "utf8");
}

function ensureEdgeConfig() {
  try {
    if (!fs.existsSync(buildDir)) {
      ensurePlaceholderTraces();
      return;
    }
    for (const targetFile of targetFiles) {
      if (!fs.existsSync(targetFile)) {
        fs.writeFileSync(targetFile, configContent, "utf8");
      }
    }
    ensurePlaceholderTraces();
  } catch {
    // Best-effort Windows workaround; the child build will still surface failures.
  }
}

function ensureDeployConfigArtifacts() {
  try {
    fs.mkdirSync(buildDir, { recursive: true });
    for (const targetFile of targetFiles) {
      if (!fs.existsSync(targetFile)) {
        fs.writeFileSync(targetFile, configContent, "utf8");
      }
    }
  } catch {
    // Best-effort Windows workaround for deploy packaging.
  }
}

function ensurePlaceholderTraces() {
  fs.mkdirSync(path.join(nextDir, "static"), { recursive: true });

  for (const rootFile of placeholderRootFiles) {
    if (!fs.existsSync(rootFile)) {
      fs.mkdirSync(path.dirname(rootFile), { recursive: true });
      const content = rootFile.endsWith("required-server-files.json")
        ? placeholderRequiredServerFilesContent
        : rootFile.endsWith("BUILD_ID")
          ? "OPEN_NEXT_WINDOWS_FALLBACK\n"
          : placeholderRootContent;
      fs.writeFileSync(rootFile, content, "utf8");
    }
  }

  for (const traceFile of placeholderTraceFiles) {
    if (!fs.existsSync(traceFile)) {
      fs.mkdirSync(path.dirname(traceFile), { recursive: true });
      fs.writeFileSync(traceFile, placeholderTraceContent, "utf8");
    }
  }

  for (const serverFile of placeholderServerFiles) {
    if (!fs.existsSync(serverFile.path)) {
      fs.mkdirSync(path.dirname(serverFile.path), { recursive: true });
      fs.writeFileSync(serverFile.path, serverFile.content, "utf8");
    }
  }

  for (const serverFile of placeholderStandaloneServerFiles) {
    if (!fs.existsSync(serverFile.path)) {
      fs.mkdirSync(path.dirname(serverFile.path), { recursive: true });
      if (serverFile.sourcePath && fs.existsSync(serverFile.sourcePath)) {
        fs.copyFileSync(serverFile.sourcePath, serverFile.path);
      } else {
        fs.writeFileSync(serverFile.path, serverFile.content, "utf8");
      }
    }
  }

  const standaloneRootTrace = path.join(standaloneNextDir, "next-server.js.nft.json");
  if (!fs.existsSync(standaloneRootTrace)) {
    fs.mkdirSync(path.dirname(standaloneRootTrace), { recursive: true });
    fs.writeFileSync(standaloneRootTrace, placeholderTraceContent, "utf8");
  }

  ensureMissingAppTraceFiles();
}

function ensureMissingAppTraceFiles() {
  if (!fs.existsSync(appServerDir)) {
    return;
  }

  const stack = [appServerDir];
  while (stack.length > 0) {
    const currentDir = stack.pop();
    if (!currentDir) {
      continue;
    }

    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".js")) {
        continue;
      }

      const tracePath = `${entryPath}.nft.json`;
      if (!fs.existsSync(tracePath)) {
        fs.writeFileSync(tracePath, placeholderTraceContent, "utf8");
      }
    }
  }
}

function mirrorRuntimeManifestsIntoBundle() {
  const filesToMirror = [
    ["required-server-files.json", "required-server-files.json"],
    ["BUILD_ID", "BUILD_ID"],
    ["routes-manifest.json", "routes-manifest.json"],
    ["prerender-manifest.json", "prerender-manifest.json"],
    ["build-manifest.json", "build-manifest.json"],
    ["app-build-manifest.json", "app-build-manifest.json"],
    ["react-loadable-manifest.json", "react-loadable-manifest.json"],
    ["app-path-routes-manifest.json", "app-path-routes-manifest.json"],
    [path.join("server", "next-font-manifest.json"), path.join("server", "next-font-manifest.json")],
    [path.join("server", "next-font-manifest.js"), path.join("server", "next-font-manifest.js")],
    [path.join("server", "webpack-runtime.js"), path.join("server", "webpack-runtime.js")],
    [path.join("server", "pages-manifest.json"), path.join("server", "pages-manifest.json")],
    [path.join("server", "app-paths-manifest.json"), path.join("server", "app-paths-manifest.json")],
    [path.join("server", "functions-config-manifest.json"), path.join("server", "functions-config-manifest.json")],
    [path.join("server", "middleware-manifest.json"), path.join("server", "middleware-manifest.json")],
    [path.join("server", "server-reference-manifest.json"), path.join("server", "server-reference-manifest.json")],
    [path.join("server", "server-reference-manifest.js"), path.join("server", "server-reference-manifest.js")],
  ];

  for (const [relativeSource, relativeTarget] of filesToMirror) {
    const sourcePath = path.join(nextDir, relativeSource);
    const targetPath = path.join(bundleNextDir, relativeTarget);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
  }
}

function copyDirectoryRecursive(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryRecursive(sourcePath, targetPath);
      continue;
    }
    if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function mirrorServerModulesIntoBundle() {
  const serverSourceDir = path.join(nextDir, "server");
  const serverTargetDir = path.join(bundleNextDir, "server");
  const serverRuntimeDirs = ["app", "pages", "chunks"];

  for (const dirname of serverRuntimeDirs) {
    copyDirectoryRecursive(path.join(serverSourceDir, dirname), path.join(serverTargetDir, dirname));
  }
}

function readJsonLiteral(relativePath, fallbackLiteral = "{}") {
  const sourcePath = path.join(nextDir, relativePath);
  if (!fs.existsSync(sourcePath)) {
    return fallbackLiteral;
  }

  try {
    return JSON.stringify(JSON.parse(fs.readFileSync(sourcePath, "utf8")));
  } catch {
    return fallbackLiteral;
  }
}

function patchBundledHandlerPageRequires() {
  if (!fs.existsSync(bundledHandlerPath)) {
    return;
  }

  const original = fs.readFileSync(bundledHandlerPath, "utf8");
  const hasPagesRequire =
    original.includes('endsWith("pages/_app.js")') &&
    original.includes('endsWith("pages/_document.js")') &&
    original.includes('endsWith("pages/_error.js")');
  if (original.includes("OPEN_NEXT_WINDOWS_PAGES_REQUIRE") || hasPagesRequire) {
    return;
  }

  const pagesRequirePatch = [
    "/* OPEN_NEXT_WINDOWS_PAGES_REQUIRE */",
    `if(pagePath.replaceAll("\\\\","/").endsWith("pages/_app.js"))return require(${JSON.stringify(path.join(bundleNextDir, "server", "pages", "_app.js"))});`,
    `if(pagePath.replaceAll("\\\\","/").endsWith("pages/_document.js"))return require(${JSON.stringify(path.join(bundleNextDir, "server", "pages", "_document.js"))});`,
    `if(pagePath.replaceAll("\\\\","/").endsWith("pages/_error.js"))return require(${JSON.stringify(path.join(bundleNextDir, "server", "pages", "_error.js"))});`,
  ].join("");

  const patched = original.replace(
    'process.env.__NEXT_PRIVATE_RUNTIME_TYPE=isAppPath?"app":"pages";try{',
    `process.env.__NEXT_PRIVATE_RUNTIME_TYPE=isAppPath?"app":"pages";try{${pagesRequirePatch}`,
  );

  if (patched !== original) {
    fs.writeFileSync(bundledHandlerPath, patched, "utf8");
  }
}

function patchBundledHandlerManifests() {
  if (!fs.existsSync(bundledHandlerPath)) {
    return;
  }

  const original = fs.readFileSync(bundledHandlerPath, "utf8");
  const loadManifestFunction = [
    "function loadManifest(path2,shouldCache=!0,cache=sharedCache,skipParse=!1){",
    'if(path2=path2.replaceAll("\\\\","/"),path2.endsWith(".next/BUILD_ID"))return process.env.NEXT_BUILD_ID;',
    `if(path2.endsWith("/required-server-files.json"))return${readJsonLiteral("required-server-files.json", placeholderRequiredServerFilesContent)};`,
    `if(path2.endsWith("/routes-manifest.json"))return${readJsonLiteral("routes-manifest.json")};`,
    `if(path2.endsWith("/prerender-manifest.json"))return${readJsonLiteral("prerender-manifest.json")};`,
    `if(path2.endsWith("/build-manifest.json"))return${readJsonLiteral("build-manifest.json")};`,
    `if(path2.endsWith("/app-build-manifest.json"))return${readJsonLiteral("app-build-manifest.json")};`,
    `if(path2.endsWith("/app-path-routes-manifest.json"))return${readJsonLiteral("app-path-routes-manifest.json", "{}")};`,
    `if(path2.endsWith("/server/pages-manifest.json"))return${readJsonLiteral(path.join("server", "pages-manifest.json"))};`,
    `if(path2.endsWith("/server/next-font-manifest.json"))return${readJsonLiteral(path.join("server", "next-font-manifest.json"))};`,
    `if(path2.endsWith("/server/middleware-manifest.json"))return${readJsonLiteral(path.join("server", "middleware-manifest.json"))};`,
    `if(path2.endsWith("/server/functions-config-manifest.json"))return${readJsonLiteral(path.join("server", "functions-config-manifest.json"))};`,
    `if(path2.endsWith("/server/app-paths-manifest.json"))return${readJsonLiteral(path.join("server", "app-paths-manifest.json"))};`,
    'let p=path2.replace(/\\.json$/,"");if(p.endsWith("react-loadable-manifest")||p.endsWith("subresource-integrity-manifest")||p.endsWith("server-reference-manifest")||p.endsWith("dynamic-css-manifest")||p.endsWith("fallback-build-manifest")||p.endsWith("prefetch-hints"))return{};',
    'throw new Error(`Unexpected loadManifest(${path2}) call!`)',
    "}",
  ].join("");
  const manifestRegex = /function loadManifest\(path2,shouldCache=!0,cache=sharedCache,skipParse=!1\)\{[\s\S]*?\}function evalManifest/;
  if (!manifestRegex.test(original)) {
    return;
  }

  let patched = original.replace(manifestRegex, `${loadManifestFunction}function evalManifest`);
  patched = patched.replace(
    "let{serverRuntimeConfig={},publicRuntimeConfig,assetPrefix,generateEtags}=this.nextConfig;",
    "let{serverRuntimeConfig={},publicRuntimeConfig={},assetPrefix,generateEtags}=this.nextConfig;",
  );
  patched = patched.replace(
    "getMiddlewareManifest(){return this.minimalMode?null:require(this.middlewareManifestPath)}",
    `getMiddlewareManifest(){return this.minimalMode?null:${readJsonLiteral(path.join("server", "middleware-manifest.json"), '{"version":3,"middleware":{},"functions":{},"sortedMiddleware":[]}')}}`,
  );
  fs.writeFileSync(bundledHandlerPath, patched, "utf8");
}

function disableBundledMiddlewareWhenUnused() {
  if (fs.existsSync(sourceMiddlewarePath) || !fs.existsSync(bundledWorkerPath)) {
    return;
  }

  const original = fs.readFileSync(bundledWorkerPath, "utf8");
  let patched = original.replace(
    '// @ts-expect-error: Will be resolved by wrangler build\nimport { handler as middlewareHandler } from "./middleware/handler.mjs";\n',
    "",
  );

  patched = patched.replace(
    `            const reqOrResp = await middlewareHandler(request, env, ctx);
            if (reqOrResp instanceof Response) {
                return reqOrResp;
            }
            // @ts-expect-error: resolved by wrangler build
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(reqOrResp, env, ctx, request.signal);`,
    `            // @ts-expect-error: resolved by wrangler build
            const { handler } = await import("./server-functions/default/handler.mjs");
            return handler(request, env, ctx, request.signal);`,
  );

  fs.writeFileSync(bundledWorkerPath, patched, "utf8");
}

patchOpenNextHelper();
patchBuildNextAppReuse();

const childEnv = {
  ...process.env,
  OPEN_NEXT_FORCE_REUSE_NEXT_BUILD: "1",
  NODE_OPTIONS: [process.env.NODE_OPTIONS, defaultNodeOptions].filter(Boolean).join(" "),
};

const child = spawn("npm exec -- opennextjs-cloudflare build", {
  cwd: appRoot,
  env: childEnv,
  stdio: "inherit",
  shell: true,
});

const interval = setInterval(ensureEdgeConfig, 300);

child.on("close", (code) => {
  clearInterval(interval);
  if ((code ?? 1) === 0) {
    ensureDeployConfigArtifacts();
    mirrorRuntimeManifestsIntoBundle();
    mirrorServerModulesIntoBundle();
    patchBundledHandlerPageRequires();
    patchBundledHandlerManifests();
    disableBundledMiddlewareWhenUnused();
  }
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  clearInterval(interval);
  console.error(error);
  process.exit(1);
});
