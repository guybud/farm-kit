# Farmkit on Cloudflare Workers

Replaces Netlify hosting for the app (farmkit.app). Marketing site (farmkit.ca)
launch is a separate, still-parked decision; its zone is preloaded here too.

## State (2026-08-19)

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
