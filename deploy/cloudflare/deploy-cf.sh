#!/bin/bash
# Build the frontend and deploy it as the farmkit-app Cloudflare worker.
# Netlify's _redirects file is stripped from the artifact: Cloudflare rejects
# its SPA rule and handles SPA fallback natively (not_found_handling).
# Delete frontend/public/_redirects once Netlify is retired.
set -euo pipefail
cd "$(dirname "$0")"

set -a; . /boot/config/backup-secrets/njmit_cloudflare.env; set +a

(cd ../../frontend && npm run build)
rm -f ../../frontend/dist/_redirects
npx wrangler deploy
