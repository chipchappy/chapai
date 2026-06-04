const fs = require("node:fs");
const path = require("node:path");

const nextDir = path.join(process.cwd(), ".next");
const target = path.join(nextDir, "required-server-files.json");
const standaloneWebDir = path.join(nextDir, "standalone", "apps", "web");
const standaloneNextDir = path.join(standaloneWebDir, ".next");

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    return false;
  }

  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  return true;
}

if (fs.existsSync(standaloneWebDir)) {
  copyDirectory(path.join(nextDir, "static"), path.join(standaloneNextDir, "static"));
  copyDirectory(path.join(process.cwd(), "public"), path.join(standaloneWebDir, "public"));
}

if (fs.existsSync(target)) {
  process.exit(0);
}

const payload = {
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
  appDir: process.cwd(),
  relativeAppDir: ".",
  files: [
    "BUILD_ID",
    "routes-manifest.json",
    "prerender-manifest.json",
    "server/app-paths-manifest.json",
    "server/functions-config-manifest.json",
    "server/middleware-manifest.json",
    "server/pages-manifest.json",
  ].filter((file) => fs.existsSync(path.join(nextDir, file))),
  ignore: [],
};

fs.writeFileSync(target, JSON.stringify(payload, null, 2));
