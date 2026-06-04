import { buildNclexWavePromotionManifest, paths, writeJson } from "./nclex-wave-utils.mjs";

function parseArgs(argv) {
  const options = {};

  for (const arg of argv) {
    if (arg.startsWith("--output=")) {
      options.outputFile = arg.slice("--output=".length);
    } else if (arg.startsWith("--candidates=")) {
      options.candidateFile = arg.slice("--candidates=".length);
    } else if (arg.startsWith("--canonical=")) {
      options.canonicalLiveFile = arg.slice("--canonical=".length);
    } else if (arg.startsWith("--bank-health=")) {
      options.bankHealthFile = arg.slice("--bank-health=".length);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const manifest = buildNclexWavePromotionManifest(options);
const outputFile = options.outputFile || paths.wavePromotionManifestFile;

writeJson(outputFile, manifest);
process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
