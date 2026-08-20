# Farmkit on Cloudflare Workers

Replaces Netlify hosting for the app (farmkit.app). Marketing site (farmkit.ca)
launch is a separate, still-parked decision; its zone is preloaded here too.

## State (2026-08-20) — DONE, app live on Cloudflare

farmkit.app now serves from the `farmkit-app` worker (verified: `server: cloudflare`,
apex resolves to CF anycast, www 200, SPA deep links 200, login renders, live bundle
points at prod Supabase `rjhffpxijysfuusriqwg`). The two Netlify records were deleted
and the custom domains attached. Netlify site `farmkit-njmit` is now unused and can be
deleted after a soak.

Remaining cleanup: delete `frontend/public/_redirects` and the `rm` line in
`deploy-cf.sh` once Netlify is torn down. farmkit.ca/.org zone activation was still
propagating at the time of writing; neither hosts anything yet.

## History — the flip (kept for the rollback details)

Nameservers for all four domains were flipped at GoDaddy (API `PATCH /v1/domains/{d}`
with `{"nameServers": [...]}`; note the `/nameServers` sub-resource 404s). Pre-flip
GoDaddy exports are kept in `dns_backup/*.pre-flip.json` along with the original
NS pairs, in case a rollback is ever needed:
farmkit.app ns43/ns44, farmkit.ca ns15/ns16, farmkit.net ns23/ns24,
farmkit.org ns59/ns60 (all `.domaincontrol.com`).

Gotcha for future custom-domain work: Cloudflare refuses to attach a Worker custom
domain while a normal DNS record for that hostname exists —

    Hostname 'farmkit.app' already has externally managed DNS records (A, CNAME,
    etc). Delete them first or try a different hostname. [code: 100117]

Deleting the old `A farmkit.app -> 75.2.60.5` and
`CNAME www.farmkit.app -> farmkit-njmit.netlify.app` cleared it; wrangler then creates
its own records. Leave every other record alone, especially the 5 MX, SPF/DKIM/DMARC
TXT, and `A dev.farmkit.app -> 100.127.242.124` (Tailnet).

## Verified after the flip

- farmkit.app and farmkit.net zones are active on Cloudflare; .ca and .org were
  still propagating.
- farmkit.app serves 200 (still Netlify, by design), www 301, worker staging 200.
- Mail records survived byte-for-byte: 5 MX with original priorities
  (aspmx 1, alt1/alt2 5, alt3/alt4 10), SPF, DKIM, DMARC.
- Mail *delivery* to nick@farmkit.app bounced, but a control send to nick@farmkit.ca
  while it was still on GoDaddy DNS bounced identically: no mailbox has ever been
  provisioned on these domains. Pre-existing, not caused by the migration.

## Original state (2026-08-19)

- Worker `farmkit-app` deployed, staging: https://farmkit-app.njmit.workers.dev
  (assets-only, SPA fallback). Deploy with `./deploy-cf.sh`.
- Zones created + preloaded in the NJMIT Cloudflare account, all pointing at
  nameservers `frida.ns.cloudflare.com` / `otto.ns.cloudflare.com`:
  - farmkit.app: full copy of GoDaddy records, DNS-only. Apex A 75.2.60.5 and
    www CNAME still point at Netlify so the flip itself changes nothing.
    Google mail records (MX x5, SPF, DKIM `google._domainkey`, DMARC) preloaded.
  - farmkit.ca: dev A (Tailnet), mail records. Apex was a GoDaddy
    "WebsiteBuilder Site" placeholder, intentionally not replicated.
  - farmkit.net / farmkit.org: mail + verification records; apex was Parked.

## Cutover (after Nick flips NS at GoDaddy)

1. Wait for `dig NS farmkit.app +short` to return the Cloudflare pair.
2. Verify nothing changed: farmkit.app still serves via Netlify records,
   `dig MX farmkit.app`, `dig +short dev.farmkit.app` (Tailnet IP), invite email
   send/receive.
3. In the farmkit.app zone: delete the apex A 75.2.60.5 and www CNAME records.
4. In wrangler.jsonc: uncomment the `routes` block, set `workers_dev: false`,
   run `./deploy-cf.sh`. Custom domains attach and serve the app from the worker.
5. Verify https://farmkit.app (fresh bundle, SPA deep links, login) + mail again.
6. Soak a few days, then retire the Netlify site and delete
   frontend/public/_redirects (and the `rm` line in deploy-cf.sh).

Deploy automation after cutover: push to main no longer auto-deploys the app
(that was Netlify). Run ./deploy-cf.sh manually or wire Workers Builds to the
GitHub repo later.

NS flip can be done via GoDaddy API (`PUT /v1/domains/{domain}/nameServers`)
or manually in the GoDaddy dashboard. Do NOT flip without Nick's explicit go.
