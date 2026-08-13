# Deployment Runbook

SquadUp ships as two pieces: a **Next.js frontend** on Vercel and a
**PocketBase server** (data + auth + integrity hooks) on your own host.
There is no shared backend code — the frontend talks to PocketBase directly
through `NEXT_PUBLIC_PB_URL`.

This runbook mirrors what the code actually reads. Every variable listed
here is either live or explicitly future; nothing is aspirational.

## 1. PocketBase server

### 1.1 Install

Download the [PocketBase binary](https://pocketbase.io/docs/) for your host
architecture (Linux x64 for most VPS/Fly/Railway setups). We target the
0.23+ line, matching the SDK pinned in `package.json`.

### 1.2 First boot

```bash
./pocketbase serve --http=0.0.0.0:8090
```

On first boot PocketBase creates `pb_data/` and auto-applies the versioned
migrations in `pb_migrations/` (committed code — schema lives with the app).
Then open the Admin UI, create your superuser, and confirm:

- `users` collection has `otp.enabled = true` and email/password auth enabled
- `swipes`, `matches`, `teams`, `tickets` collections exist with the fields
  from `pb_migrations/` (the domain hooks enforce the invariants at runtime)

`pb_data/` is gitignored; never commit it.

### 1.3 Required process env

These are read from the **PB process env**, not the frontend `.env`:

| Variable                | Read by               | Effect                                                                                                                             |
| ----------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ALLOWED_SIGNUP_DOMAIN` | `pb_hooks/main.pb.js` | Comma-separated college domains allowed to register. Falls back to `college.edu` when unset.                                       |
| `SQUADUP_OTP_ALLOWLIST` | `pb_hooks/main.pb.js` | Comma-separated exact emails allowed to request OTP codes outside the college domain (demo-day / mentor accounts). Empty = nobody. |

Example:

```bash
ALLOWED_SIGNUP_DOMAIN=college.edu,uni.example \
SQUADUP_OTP_ALLOWLIST=mentor@partner.org,judge@demo-day.org \
./pocketbase serve --http=0.0.0.0:8090
```

### 1.4 Email (OTP delivery)

In the PB Admin UI: Settings → Mail. Use Resend's SMTP:

- Host `smtp.resend.com`, port `587`, STARTTLS
- User `resend`, password = your Resend API key
- From address: `SquadUp <noreply@yourdomain>` (must be a verified domain)

The `onMailerRecordOTPSend` hook gates _sending_ — a request for a
non-college, non-allowlisted address is rejected before any email fires.

### 1.5 Known flag: `users.status` has no default

`users.status` is `required: true` with values `["solo", "in_team"]` and
**no default** (flagged during I9 — fresh OTP records created before
onboarding would fail the insert). The deferred one-line fix lives in the
register hook in `pb_hooks/main.pb.js`; add it next to the email gate:

```js
onRecordBeforeCreateRequest((e) => {
  // ...existing email gate...
  if (!e.record.get("status")) {
    e.record.set("status", "solo");
  }
}, "users");
```

This is documented here so a deploy never surprises you with a failed insert.

## 2. Frontend (Vercel)

### 2.1 Env vars

Set **one** variable in the Vercel project (both Production and Preview):

| Variable             | Value                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_PB_URL` | `https://pb.yourhost.example` — the public HTTPS URL of the PB server |

It is public by design; PocketBase enforces auth server-side. Point it at a
real domain with TLS — PocketBase serves plain HTTP and the browser blocks
mixed content.

### 2.2 Deploy

`vercel.json` pins the Next.js framework and adds hardened default headers
(`X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`,
`Permissions-Policy`). The `Gate` CI check (typecheck → test → lint → build)
must pass before merge; Vercel builds from `main` automatically.

No rewrites are needed — the Next pages router serves itself.

## 3. Future integrations

| Variable                                    | When                                       | Notes                                          |
| ------------------------------------------- | ------------------------------------------ | ---------------------------------------------- |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Feature 4B (commit graph + activity score) | OAuth app creds; never put in the frontend env |

## 4. Local development

```bash
cp .env.example .env        # NEXT_PUBLIC_PB_URL defaults to http://127.0.0.1:8090
./pocketbase serve          # terminal 1 — migrations auto-apply
npm run dev                 # terminal 2 — http://localhost:3000
```

`ALLOWED_SIGNUP_DOMAIN` and `SQUADUP_OTP_ALLOWLIST` default to
`college.edu` / empty respectively when unset, so a bare `pb serve` works
out of the box for the demo domain.
