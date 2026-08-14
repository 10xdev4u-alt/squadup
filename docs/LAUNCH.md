# Beta Launch Runbook (I27 · §11 Phase 8)

SquadUp's beta launch checklist. Read `DEPLOYMENT.md` first — this assumes the
two-piece deployment (Next.js on Vercel, PocketBase on your own host) is
already running. Everything here is opt-in and reversible.

## 1. Pre-launch configuration

| Variable                | Where          | Purpose                                                                                                |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `ALLOWED_SIGNUP_DOMAIN` | PB process env | The college domain(s) that may register.                                                               |
| `SQUADUP_OTP_ALLOWLIST` | PB process env | Exact emails allowed OTP outside the college domain (mentors, demo-day judges).                        |
| `SQUADUP_SEED_DEMO`     | PB process env | `1` to load the demo seed on an **empty** database. Never set it on a database that already has teams. |
| `NEXT_PUBLIC_PB_URL`    | Frontend env   | Public HTTPS URL of the PocketBase server.                                                             |

## 2. Seed the demo data (optional, first boot only)

The seed runs inside a migration (`pb_migrations/seed_demo.js`) and is doubly
guarded: it only runs when `SQUADUP_SEED_DEMO=1` **and** the `teams` collection
is empty. It creates 8 demo users (random passwords — not meant to be logged
into), 6 problem statements, 6 teams (3 open / 3 closed) and 2-3 kanban tasks
per team.

```bash
SQUADUP_SEED_DEMO=1 ./pocketbase serve --http=0.0.0.0:8090
```

Verify: the admin UI's `teams` collection lists 6 rows, and `/admin/analytics`
shows domain + activity data. If you restart with `SQUADUP_SEED_DEMO` unset or
the database non-empty, nothing changes.

## 3. Launch checklist

- [ ] `ALLOWED_SIGNUP_DOMAIN` points at the real college domain(s).
- [ ] A superuser exists in the PB admin UI.
- [ ] Mentors marked via the PB dashboard (`users.mentor = true`) — they appear
      in the `/mentor` inbox; non-mentors get 403 on status changes server-side.
- [ ] Admins marked via the PB dashboard (`users.admin = true`) — gates
      `/admin/teams` and `/admin/analytics`.
- [ ] `NEXT_PUBLIC_PB_URL` is the public HTTPS URL; frontend build passes
      (`npm run build`) and `Gate` CI is green on main.
- [ ] Demo seed loaded on an empty database (or confirmed skipped deliberately).
- [ ] `/` (discover), `/teams`, `/team/[id]`, `/team/[id]/board`,
      `/team/[id]/resources`, `/team/[id]/tickets` all reachable after auth.

## 4. Metrics verification (§12)

The metrics hooks (`pb_hooks/main.pb.js`) write anonymous events to the
`metrics_events` collection (admin-only read). Tracked actions:

- `team_created` — a team record is created
- `ticket_resolved` — a mentor ticket moves to `resolved`
- `task_final_pitch` — a kanban task moves to `final_pitch`

Verify after a short real session:

```bash
# In the PB admin UI → metrics_events, or:
curl -H "Authorization: Bearer <admin-token>" \
  https://pb.yourhost.example/api/collections/metrics_events/records
```

Expected: at least one `team_created` after a team forms, and rows appearing
as tickets resolve and tasks reach the final pitch column. Events carry no
user ids or emails — aggregates only, per the §12 no-PII rule.

## 5. Post-launch (§12 metrics to watch)

- % of solo users who find a team within 7 days
- Average time from signup to team formation
- Tickets resolved over time
- Task completion rate before deadlines
- Team retention (workspace used daily vs abandoned)

## 6. Rollback

- Seed: restart PocketBase without `SQUADUP_SEED_DEMO`; the guard means a
  non-empty database is never touched.
- Metrics: the hooks swallow failures, so the write path is never blocked.
  Remove the `metrics_events` collection via the admin UI if unwanted.
