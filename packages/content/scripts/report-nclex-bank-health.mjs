import { buildNclexBankHealthReport, paths, writeJson } from "./nclex-wave-utils.mjs";

function parseArgs(argv) {
  const options = {};

  for (const arg of argv) {
    if (arg.startsWith("--output=")) {
      options.outputFile = arg.slice("--output=".length);
    } else if (arg.startsWith("--raw=")) {
      options.rawLiveFile = arg.slice("--raw=".length);
    } else if (arg.startsWith("--canonical=")) {
      options.canonicalLiveFile = arg.slice("--canonical=".length);
    } else if (arg.startsWith("--draft=")) {
      options.draftFile = arg.slice("--draft=".length);
    } else if (arg.startsWith("--review=")) {
      options.reviewReportFile = arg.slice("--review=".length);
    } else if (arg.startsWith("--curation=")) {
      options.curationReportFile = arg.slice("--curation=".length);
    } else if (arg.startsWith("--sync=")) {
      options.syncReportFile = arg.slice("--sync=".length);
    }
  }

  return options;
}

const options = parseArgs(process.argv.slice(2));
const report = buildNclexBankHealthReport(options);
const outputFile = options.outputFile || paths.bankHealthReportFile;

writeJson(outputFile, report);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
