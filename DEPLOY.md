# Container Deployment

Three environments, three boxes — each running Docker Compose with the same images, different routes, different secrets.

```
┌────────────────┐    ┌────────────────┐    ┌────────────────┐
│ staging        │    │ beta           │    │ production     │
│ .neurago.ai    │    │ .neurago.ai    │    │ .neurago.ai    │
└──────┬─────────┘    └──────┬─────────┘    └──────┬─────────┘
       │                     │                     │
       │ pull :staging       │ pull :beta          │ pull :production
       ▼                     ▼                     ▼
   ats / aiocrm / kudodoc / jobplatform / web  (same 5 services per box)
       │
       ▼
   Cloudflare tunnel → ats.staging.neurago.ai etc.
```

## One-time box setup (per env)

```bash
# On staging.neurago.ai (and repeat for beta + prod)
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER  # log out + back in

# Pull secrets from Vaultwarden — write to .env.local with chmod 600
# (sync-secrets script comes once we wire up the keyvault integration)
mkdir -p /opt/inhrnt && cd /opt/inhrnt
chmod 700 .  # only this user can read

# First deploy will scp the compose files here
```

## Build images locally, deploy to a box

From your laptop:

```bash
# Build & push :staging tag, then ssh + docker compose pull/up on staging.neurago.ai
REGISTRY=ghcr.io/sandeepsaroha2/inherenttech bin/deploy.sh staging

# Promote staging build to beta (same image SHA, retagged):
docker pull ghcr.io/sandeepsaroha2/inherenttech/ats:staging
docker tag  ghcr.io/sandeepsaroha2/inherenttech/ats:staging ghcr.io/sandeepsaroha2/inherenttech/ats:beta
docker push ghcr.io/sandeepsaroha2/inherenttech/ats:beta
# (repeat for the 4 other apps OR just rerun: bin/deploy.sh beta --skip-build)

# Cut a production release with semver tag
bin/deploy.sh production v0.4.2
```

## Just build, no push

```bash
bin/build-images.sh                       # all 5 apps, :latest, local only
bin/build-images.sh --tag staging         # tag :staging, still local
bin/build-images.sh --apps ats,aiocrm     # subset
```

## Just restart on a box (no rebuild)

```bash
bin/deploy.sh staging --skip-build
```

## Cloudflare tunnel routing per env

Each box runs its own `cloudflared` daemon with config like:

```yaml
# /etc/cloudflared/config.yml on staging.neurago.ai
tunnel: <staging-tunnel-id>
ingress:
  - hostname: ats.staging.neurago.ai      , service: http://localhost:4001
  - hostname: crm.staging.neurago.ai      , service: http://localhost:4000
  - hostname: docs.staging.neurago.ai     , service: http://localhost:4002
  - hostname: jobs.staging.neurago.ai     , service: http://localhost:4003
  - hostname: app.staging.neurago.ai      , service: http://localhost:4004
  - service: http_status:404
```

Same shape on beta + prod, swap the hostnames.

## Image contents

`Dockerfile` is a single multi-stage build with `--build-arg APP=<app-name>`:

| Stage   | Base               | Caches  | Size    |
|---------|--------------------|---------|---------|
| deps    | node:20-alpine     | npm     | ~600 MB |
| builder | node:20-alpine     | turbo   | ~1.2 GB |
| runner  | node:20-alpine     | —       | ~150 MB |

Only the `runner` stage ships. Uses `output: 'standalone'` from Next.js with `outputFileTracingRoot` set to the monorepo root, so workspace deps (`@inherenttech/db`, `@inherenttech/ui`, `@inherenttech/shared`) are bundled correctly.

## Tag convention

| Tag           | Source                  | Promoted to |
|---------------|-------------------------|-------------|
| `:latest`     | Local builds            | nowhere     |
| `:staging`    | Auto from `main` branch | staging box |
| `:beta`       | Manual retag of staging | beta box    |
| `:production` | Manual retag of beta    | prod box    |
| `:v0.x.y`     | Cut from beta on release | prod box    |
| `:cache`      | BuildKit cache layers    | (internal)  |

## Secrets (the missing piece — comes next)

Each box's `/opt/inhrnt/.env.local` is **not** tracked in git. It's pulled from Vaultwarden at deploy time using the upcoming `bin/sync-secrets.sh` (depends on `bw` CLI installation).

Until that's wired up, you can hand-copy `.env` to each box once:

```bash
scp .env  ubuntu@staging.neurago.ai:/opt/inhrnt/.env.local
chmod 600 /opt/inhrnt/.env.local  # on the box
```

### ⚠️ Gotcha — escape `$` in `.env.local`

Docker Compose interpolates `${VAR}` patterns inside env-file values too. Any
secret containing a literal `$` (e.g. `VONAGE_API_SECRET`, `CEIPAL_PASSWORD`)
will be silently mangled — compose will try to look up `$everything-after`
and substitute empty string.

**Fix**: double every `$` in env-file values destined for compose:

```bash
# in .env.local on each box (NOT in the source .env on your laptop):
CEIPAL_PASSWORD=mypassword$with$dollars         # WRONG — gets mangled
CEIPAL_PASSWORD=mypassword$$with$$dollars       # RIGHT — preserved as-is
```

The upcoming `bin/sync-secrets.sh` will do this escape automatically when
writing `.env.local` from Vaultwarden.
