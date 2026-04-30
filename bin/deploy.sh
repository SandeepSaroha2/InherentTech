#!/usr/bin/env bash
# Deploy InherentTech containers to a target environment box.
#
# Assumes you can SSH to the box (staging.neurago.ai / beta.neurago.ai /
# prod.neurago.ai) with passwordless key auth, and that Docker is installed
# on the box.
#
# Usage:
#   bin/deploy.sh staging                # build, push, deploy to staging.neurago.ai
#   bin/deploy.sh beta                   # build :beta, push, deploy to beta.neurago.ai
#   bin/deploy.sh production v0.4.2      # tag :v0.4.2, push, deploy to prod.neurago.ai
#   bin/deploy.sh staging --skip-build   # don't rebuild, just pull-and-restart
#
# Required env (or supplied via direnv on your laptop):
#   REGISTRY            e.g. ghcr.io/sandeepsaroha2/inherenttech
#   SSH_KEY             path to ssh key (default: ~/.ssh/id_ed25519)
#   SSH_USER            user on the box (default: ubuntu)
set -euo pipefail

ENV_NAME="${1:?Usage: deploy.sh <staging|beta|production> [tag]}"
TAG="${2:-${ENV_NAME}}"
SKIP_BUILD=false
[ "${3:-}" = "--skip-build" ] && SKIP_BUILD=true

case "${ENV_NAME}" in
  staging)    HOST="staging.neurago.ai" ;;
  beta)       HOST="beta.neurago.ai" ;;
  production) HOST="prod.neurago.ai" ;;
  *) echo "Unknown env: ${ENV_NAME}"; exit 1 ;;
esac

REGISTRY="${REGISTRY:-ghcr.io/sandeepsaroha2/inherenttech}"
SSH_USER="${SSH_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-${HOME}/.ssh/id_ed25519}"
REMOTE_DIR="/opt/inhrnt"

echo "→ Target:    ${ENV_NAME} (${HOST})"
echo "→ Registry:  ${REGISTRY}"
echo "→ Tag:       ${TAG}"
echo ""

# 1. Build & push (unless skipped)
if [ "${SKIP_BUILD}" = "false" ]; then
  echo "── Building & pushing images ──"
  REGISTRY="${REGISTRY}" bin/build-images.sh --tag "${TAG}" --push
fi

# 2. Sync compose files to box
echo "── Syncing compose files to ${HOST} ──"
ssh -i "${SSH_KEY}" "${SSH_USER}@${HOST}" "mkdir -p ${REMOTE_DIR}"
scp -i "${SSH_KEY}" \
  docker-compose.yml \
  docker-compose.${ENV_NAME}.yml \
  "${SSH_USER}@${HOST}:${REMOTE_DIR}/"

# 3. Pull, restart on the box
echo "── Pulling & restarting containers on ${HOST} ──"
ssh -i "${SSH_KEY}" "${SSH_USER}@${HOST}" bash -s <<EOF
set -euo pipefail
cd ${REMOTE_DIR}
export REGISTRY="${REGISTRY}"
export IMAGE_TAG="${TAG}"

# Login to registry if creds are present (one-time setup)
if [ -n "\${GHCR_TOKEN:-}" ]; then
  echo "\${GHCR_TOKEN}" | docker login ghcr.io -u "\${GHCR_USER:-ci}" --password-stdin
fi

docker compose -f docker-compose.yml -f docker-compose.${ENV_NAME}.yml pull
docker compose -f docker-compose.yml -f docker-compose.${ENV_NAME}.yml up -d --remove-orphans
docker compose -f docker-compose.yml -f docker-compose.${ENV_NAME}.yml ps
EOF

echo ""
echo "✓ Deployed ${TAG} → ${ENV_NAME} (${HOST})"
echo "  Verify: ssh ${SSH_USER}@${HOST} 'docker ps'"
