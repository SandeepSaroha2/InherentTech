#!/usr/bin/env bash
# Build Docker images for all 5 InherentTech apps.
#
# Usage:
#   bin/build-images.sh                              # build all, tag :latest
#   bin/build-images.sh --tag staging                # tag :staging instead
#   bin/build-images.sh --tag staging --push         # also push to $REGISTRY
#   bin/build-images.sh --apps ats,aiocrm            # subset only
#   REGISTRY=ghcr.io/sandeepsaroha2/inherenttech bin/build-images.sh --tag beta --push
set -euo pipefail

REGISTRY="${REGISTRY:-inherenttech}"
TAG="latest"
APPS="ats,aiocrm,web,kudodoc,jobplatform"
PUSH=false
PLATFORM="${PLATFORM:-linux/amd64}"   # linux/amd64,linux/arm64 for multi-arch

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tag)      TAG="$2"; shift 2 ;;
    --apps)     APPS="$2"; shift 2 ;;
    --push)     PUSH=true; shift ;;
    --platform) PLATFORM="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's/^# \?//'
      exit 0 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

echo "→ Registry:  ${REGISTRY}"
echo "→ Tag:       ${TAG}"
echo "→ Apps:      ${APPS}"
echo "→ Platform:  ${PLATFORM}"
echo "→ Push:      ${PUSH}"
echo ""

# Use buildx for caching + multi-arch support
docker buildx inspect inhrnt-builder >/dev/null 2>&1 || \
  docker buildx create --name inhrnt-builder --use

IFS=',' read -ra APP_LIST <<< "${APPS}"

for app in "${APP_LIST[@]}"; do
  IMG="${REGISTRY}/${app}:${TAG}"
  echo "════════════════════════════════════════════════"
  echo "  Building ${IMG}"
  echo "════════════════════════════════════════════════"

  BUILD_ARGS=(
    --platform "${PLATFORM}"
    --build-arg "APP=${app}"
    --tag "${IMG}"
    --file Dockerfile
    --cache-from "type=registry,ref=${REGISTRY}/${app}:cache"
  )
  if [ "${PUSH}" = "true" ]; then
    BUILD_ARGS+=(--push)
    BUILD_ARGS+=(--cache-to "type=registry,ref=${REGISTRY}/${app}:cache,mode=max")
  else
    BUILD_ARGS+=(--load)
  fi

  docker buildx build "${BUILD_ARGS[@]}" .
  echo "  ✓ ${IMG}"
  echo ""
done

echo "All images built${PUSH:+ + pushed} ✓"
