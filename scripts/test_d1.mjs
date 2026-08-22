import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const WRANGLER = '/home/chapman/.nvm/versions/node/v22.22.1/bin/wrangler';

function d1(sql) {
  const env = { ...process.env };
  delete env.CLOUDFLARE_API_TOKEN;
  delete env.CLOUDFLARE_ACCOUNT_ID;
  const raw = execFileSync(process.execPath, [
    WRANGLER, 'd1', 'execute', 'chapai-prod', '--remote', '--json', '--command',
    sql.replace(/\s+/g, ' ').trim(),
  ], { cwd: resolve(ROOT, 'apps/web'), env, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  return JSON.parse(raw.slice(raw.indexOf('[')))[0]?.results ?? [];
}

console.log('Testing D1...');
try {
  const res = d1('SELECT 1 as test;');
  console.log('Result:', res);
} catch (e) {
  console.error('Error:', e.message);
}