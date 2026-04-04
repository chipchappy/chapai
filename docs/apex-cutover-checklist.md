# Apex Cutover Checklist

## Goal
- Make [https://chapaisolutions.com](https://chapaisolutions.com) and `www.chapaisolutions.com` serve the live ChapAI app that is already working on `clarityccrn.chapaisolutions.com`.

## What is already true
- The live app is running locally on `http://localhost:3001`.
- The named Cloudflare tunnel local config already includes:
  - `chapaisolutions.com`
  - `www.chapaisolutions.com`
  - `clarityccrn.chapaisolutions.com`
- Local tunnel config file:
  - [`C:\Users\Chapman\.cloudflared\ccrn-live-config.yml`](C:\Users\Chapman\.cloudflared\ccrn-live-config.yml)

## Shortest human action list
1. Open **Cloudflare Zero Trust** and select tunnel `46ef0967-62ab-4f4f-a766-41fb93b4a3fe`.
2. In that tunnel, add or verify these public hostnames:
   - `chapaisolutions.com` -> `http://localhost:3001`
   - `www.chapaisolutions.com` -> `http://localhost:3001`
3. In **Cloudflare DNS**, confirm the apex `@` and `www` tunnel-managed proxied records exist.
4. Keep the app running with:
   - [`C:\Users\Chapman\Desktop\ai\chapai\scripts\start-prod-from-legacy-env.ps1`](C:\Users\Chapman\Desktop\ai\chapai\scripts\start-prod-from-legacy-env.ps1)
5. Keep the named tunnel running with:
   - [`C:\Users\Chapman\Desktop\ai\chapai\scripts\start-named-tunnel.cmd`](C:\Users\Chapman\Desktop\ai\chapai\scripts\start-named-tunnel.cmd)
   - or the combined launcher:
   - [`C:\Users\Chapman\Desktop\ai\chapai\scripts\start-prod-tunnel.cmd`](C:\Users\Chapman\Desktop\ai\chapai\scripts\start-prod-tunnel.cmd)
6. After propagation, verify:
   - [https://chapaisolutions.com](https://chapaisolutions.com)
   - [https://www.chapaisolutions.com](https://www.chapaisolutions.com)

## What is not needed for the shortest path
- `wrangler login`
- Worker deploy
- changes to `wrangler.jsonc`

## Why
- The app code and named tunnel are already working.
- The missing step is Cloudflare-side public hostname and DNS wiring for the apex and `www`.
