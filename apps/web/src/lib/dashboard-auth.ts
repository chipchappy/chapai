import { timingSafeEqual } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

export const DASHBOARD_AUTH_COOKIE = "chapai_guild_access";
const DEFAULT_KEY_PATH = path.join(process.cwd(), "config", "dashboard-access-key.txt");

function readFileKey() {
  try {
    const raw = fs.readFileSync(DEFAULT_KEY_PATH, "utf8").trim();
    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export function getDashboardAccessKey() {
  return process.env.DASHBOARD_ACCESS_KEY ?? process.env.CHAPAI_DASHBOARD_ACCESS_KEY ?? readFileKey();
}

export function compareDashboardAccessKey(candidate: string | undefined | null) {
  const expected = getDashboardAccessKey();
  if (!expected || !candidate) {
    return false;
  }

  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function getDashboardKeyPath() {
  return DEFAULT_KEY_PATH;
}
