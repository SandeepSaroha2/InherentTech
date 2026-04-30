#!/usr/bin/env bash
# One-time setup for a fresh staging/beta/prod box. Run from your laptop.
#
# Performs on the remote box:
#   1. Update apt + install Docker + compose plugin
#   2. Install cloudflared
#   3. Create /opt/inhrnt/ with chmod 700
#   4. Drop a starter cloudflared config (you fill in tunnel id + cert)
#   5. Login to GHCR if GHCR_TOKEN is set
#   6. Print next steps
#
# Usage:
#   bin/bootstrap-box.sh staging
#   bin/bootstrap-box.sh beta
#   bin/bootstrap-box.sh production
#
# Required env (set in your laptop shell):
#   SSH_USER       default: ubuntu
#   SSH_KEY        default: ~/.ssh/id_ed25519
#   GHCR_TOKEN     personal access token with read:packages (optional, for private images)
#   GHCR_USER      default: sandeepsaroha2
set -euo pipefail

ENV_NAME="${1:?Usage: bootstrap-box.sh <staging|beta|production>}"

case "$ENV_NAME" in
  staging)    HOST="staging.neurago.ai" ;;
  beta)       HOST="beta.neurago.ai" ;;
  production) HOST="prod.neurago.ai" ;;
  *) echo "Unknown env: $ENV_NAME"; exit 1 ;;
esac

SSH_USER="${SSH_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519}"
GHCR_USER="${GHCR_USER:-sandeepsaroha2}"

echo "════════════════════════════════════════════════"
echo "  Bootstrapping ${ENV_NAME} (${HOST})"
echo "════════════════════════════════════════════════"

ssh -i "$SSH_KEY" "$SSH_USER@$HOST" bash -s <<EOF
set -euo pipefail

echo "── 1. Update apt ──"
sudo apt-get update -qq

echo "── 2. Install Docker + compose plugin ──"
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get install -y -qq docker.io docker-compose-plugin
  sudo usermod -aG docker "$SSH_USER"
  echo "  ✓ Docker installed (you may need to re-ssh for group membership)"
else
  echo "  ✓ Docker already installed: \$(docker --version)"
fi

echo "── 3. Install cloudflared ──"
if ! command -v cloudflared >/dev/null 2>&1; then
  curl -sSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
  sudo dpkg -i /tmp/cloudflared.deb
  rm /tmp/cloudflared.deb
  echo "  ✓ cloudflared installed: \$(cloudflared --version | head -1)"
else
  echo "  ✓ cloudflared already installed: \$(cloudflared --version | head -1)"
fi

echo "── 4. Create /opt/inhrnt/ ──"
sudo mkdir -p /opt/inhrnt
sudo chown "$SSH_USER:$SSH_USER" /opt/inhrnt
chmod 700 /opt/inhrnt
echo "  ✓ /opt/inhrnt/ ready"

echo "── 5. Cloudflared config template ──"
sudo mkdir -p /etc/cloudflared
if [ ! -f /etc/cloudflared/config.yml ]; then
  sudo tee /etc/cloudflared/config.yml > /dev/null <<'YAML'
# Replace <TUNNEL_ID> and run "cloudflared tunnel login" + "cloudflared tunnel create ${ENV_NAME}-inhrnt"
# Then: sudo cloudflared service install
tunnel: <TUNNEL_ID>
credentials-file: /etc/cloudflared/<TUNNEL_ID>.json

ingress:
  # Replace these hostnames per environment (already templated for ${ENV_NAME}):
  - hostname: ats.${ENV_NAME}.neurago.ai
    service: http://localhost:4001
  - hostname: crm.${ENV_NAME}.neurago.ai
    service: http://localhost:4000
  - hostname: docs.${ENV_NAME}.neurago.ai
    service: http://localhost:4002
  - hostname: jobs.${ENV_NAME}.neurago.ai
    service: http://localhost:4003
  - hostname: app.${ENV_NAME}.neurago.ai
    service: http://localhost:4004
  - service: http_status:404
YAML
  echo "  ✓ /etc/cloudflared/config.yml created (FILL IN TUNNEL_ID before starting)"
else
  echo "  ✓ /etc/cloudflared/config.yml already exists — leaving alone"
fi

echo "── 6. GHCR login ──"
if [ -n "${GHCR_TOKEN:-}" ]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
else
  echo "  ⚠️  GHCR_TOKEN not set on laptop — run docker login ghcr.io manually on this box later"
fi

echo "── 7. Hardening ──"
sudo systemctl enable docker
echo "  ✓ Docker enabled at boot"

echo ""
echo "✓ Bootstrap of ${HOST} complete"
echo ""
echo "Next steps on this box:"
echo "  1. cloudflared tunnel login              # opens a browser link"
echo "  2. cloudflared tunnel create ${ENV_NAME}-inhrnt"
echo "  3. Edit /etc/cloudflared/config.yml — fill in tunnel id + creds path"
echo "  4. sudo cloudflared service install"
echo "  5. Pull secrets: scp .env.local from laptop to /opt/inhrnt/"
echo "  6. From your laptop: bin/deploy.sh ${ENV_NAME}"
EOF

echo ""
echo "════════════════════════════════════════════════"
echo "  ✓ ${HOST} bootstrapped"
echo "════════════════════════════════════════════════"
