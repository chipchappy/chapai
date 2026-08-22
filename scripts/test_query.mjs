import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WRANGLER = '/home/chapman/.nvm/versions/node/v22.22.1/bin/wrangler';

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_KEY;
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const raw = execFileSync(process.execPath, [
    WRANGLER, 'd1', 'execute', 'chapai-prod', '--remote', '--json', '--command',
    sql.replace(/\s+/g, ' ').trim(),
  ], { cwd: resolve(ROOT, 'apps/web'), env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf('[')))[0]?.results ?? [];
}

const query = `
    SELECT id, scenario_title, scenario, stem, matrixColumns, matrixRows, options, correctOrder, distractorRationales
    FROM questions
    WHERE exam = 'nclex'
      AND type IN ('matrix', 'ordering')
      AND publishState = 'published'
      AND (distractorRationales IS NULL OR distractorRationales = '')
    ORDER BY id
    LIMIT 2;
  `;

console.log('Query:', query);
try {
  const res = d1(query);
  console.log('Result:', res);
} catch (e) {
  console.error('Error:', e.message);
}