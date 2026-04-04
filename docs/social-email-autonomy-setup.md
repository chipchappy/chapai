# Social and Email Autonomy Setup

This is the shortest path to turn Mercury and Beacon from `manual-ready` into approval-gated operators.

Public verification links now available:

- `https://clarityccrn.chapaisolutions.com/privacy`
- `https://clarityccrn.chapaisolutions.com/terms`

Current local readiness:

- X: `api-ready`
- Instagram: `semi-auto` and still missing `CHAPAI_INSTAGRAM_BUSINESS_ID`
- Email: `approval-ready` for Resend, but first live send still requires `CHAPAI_EMAIL_API_KEY` or `RESEND_API_KEY`

## Current exact unblockers

These are the only missing items for full approval-gated autonomy right now:

1. Instagram:
   - `CHAPAI_INSTAGRAM_BUSINESS_ID`
   - Meta currently returns no linked Facebook Pages for the active token, so the fix is:
     - connect the target Instagram professional account to a Facebook Page
     - refresh the Meta token with `pages_show_list`, `instagram_basic`, and `instagram_content_publish`
     - then rerun `import-growth-credentials.ps1`
2. Outbound email:
   - `CHAPAI_EMAIL_API_KEY` or `RESEND_API_KEY`
   - the current Cloudflare email key is useful for Cloudflare admin/routing, but it is **not** the send key Beacon needs for Resend dispatch

## 1. Domain email identities

Create these aliases on `chapaisolutions.com`:

- `social@chapaisolutions.com`
- `creators@chapaisolutions.com`
- `daily@chapaisolutions.com`
- `partnerships@chapaisolutions.com`

Recommended use:

- `social@chapaisolutions.com`: creator replies and social signatures
- `creators@chapaisolutions.com`: formal creator outreach
- `daily@chapaisolutions.com`: daily question emails
- `partnerships@chapaisolutions.com`: educator and hospital outreach

If the domain is on Cloudflare:

1. Open Cloudflare dashboard for `chapaisolutions.com`.
2. Go to `Email` or `Email Routing`.
3. Enable Email Routing.
4. Add a destination mailbox you already control.
5. Create the aliases above and route them to that destination mailbox.

## 2. Resend for outbound email

Beacon can send as soon as the domain is verified and the API key exists.

Steps:

1. Create or open a Resend account.
2. Add the domain `chapaisolutions.com`.
3. Add the DNS records Resend asks for.
4. Wait until the domain is verified.
5. Create an API key with send access.

Set these environment variables on this machine:

```powershell
[Environment]::SetEnvironmentVariable("CHAPAI_EMAIL_PROVIDER", "resend", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_EMAIL_FROM", "daily@chapaisolutions.com", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_EMAIL_API_KEY", "<YOUR_RESEND_API_KEY>", "User")
```

Close and reopen the terminal after setting them.

## 3. X credentials for Mercury

Mercury expects full write credentials for an approval-gated X bridge.

Steps:

1. Open the X developer portal.
2. Create a Project and App.
3. Set app permissions to `Read and write`.
4. Generate:
   - API Key
   - API Key Secret
   - Access Token
   - Access Token Secret

Set these environment variables:

```powershell
[Environment]::SetEnvironmentVariable("CHAPAI_X_API_KEY", "<API_KEY>", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_X_API_SECRET", "<API_SECRET>", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_X_ACCESS_TOKEN", "<ACCESS_TOKEN>", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_X_ACCESS_SECRET", "<ACCESS_SECRET>", "User")
```

## 4. Instagram publishing credentials for Mercury

Mercury expects a Meta app plus an Instagram professional account.

Requirements:

- Instagram account must be `Professional`
- Instagram account must be linked to a Facebook Page
- Meta developer app must exist

Steps:

1. Convert the Instagram account to a professional account if needed.
2. Link it to a Facebook Page.
3. Create a Meta developer app.
4. Add Instagram Graph API permissions.
5. Generate a long-lived access token for the linked Page or app flow you choose.
6. Get the Instagram Business Account ID.

Set these environment variables:

```powershell
[Environment]::SetEnvironmentVariable("CHAPAI_META_APP_ID", "<META_APP_ID>", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_META_APP_SECRET", "<META_APP_SECRET>", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_META_ACCESS_TOKEN", "<META_ACCESS_TOKEN>", "User")
[Environment]::SetEnvironmentVariable("CHAPAI_INSTAGRAM_BUSINESS_ID", "<INSTAGRAM_BUSINESS_ID>", "User")
```

## 5. Verify readiness

After setting credentials, reopen the terminal and run:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\run-social-dispatch.ps1
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\run-email-dispatch.ps1
```

Then check:

- `C:\Users\Chapman\Desktop\ai\chapai\config\social-outbox\dispatch-state.json`
- `C:\Users\Chapman\Desktop\ai\chapai\config\email-outbox\dispatch-state.json`

Expected transition:

- social: `manual-ready` -> `approval-ready` -> `adapter-ready`
- email: `blocked` -> `approval-ready` -> `send-ready` -> `sent`

## 6. Safe operating rule

Public sends stay approval-gated even after credentials are configured.

Mercury and Beacon can:

- collect opportunities
- prepare posts and emails
- rank targets
- keep approval packets fresh

They should not publicly send without the final approval flag.

## 7. Current scripts already wired to these variables

- `C:\Users\Chapman\Desktop\ai\chapai\scripts\run-social-dispatch.ps1`
- `C:\Users\Chapman\Desktop\ai\chapai\scripts\run-email-dispatch.ps1`
- `C:\Users\Chapman\Desktop\ai\chapai\scripts\run-social-studio.ps1`
- `C:\Users\Chapman\Desktop\ai\chapai\scripts\run-outreach-email-lane.ps1`

## 8. Creator, tester, and demo keys

Issue a key directly from this machine with:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\issue-access-key.ps1 -Type creator-pass -Label creator-launch -Scope creator -MaxRedeems 3 -ExpiresInHours 336
```

Useful variants:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\issue-access-key.ps1 -Type tester-pass -Label tester-wave -Scope tester -MaxRedeems 5 -ExpiresInHours 168
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\issue-access-key.ps1 -Type demo-pass -Label live-demo -Scope preview -MaxRedeems 25 -ExpiresInHours 720
powershell -ExecutionPolicy Bypass -File C:\Users\Chapman\Desktop\ai\chapai\scripts\issue-access-key.ps1 -Type reviewer-pass -Label reviewer-24h -Scope review -MaxRedeems 1 -ExpiresInHours 24
```

Redemption URL:

- `https://clarityccrn.chapaisolutions.com/demo-access`
