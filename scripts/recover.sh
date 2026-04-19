#!/bin/bash
# =============================================================================
# InherentTech Platform — Service Recovery Script
# Checks and restarts: Cloudflare Tunnel, 5 Next.js apps, n8n
#
# Usage:
#   ./scripts/recover.sh          # run once
#   ./scripts/recover.sh --watch  # loop every 60s (daemon mode)
#
# Auto-start on login:
#   launchctl load ~/Library/LaunchAgents/com.inherenttech.recover.plist
# =============================================================================

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_DIR="/Volumes/ExtremeSSD/Projects/InherentTech/InherentTechPlatform"
LOG_DIR="/tmp/inherenttech"
TUNNEL_CONFIG="$HOME/.cloudflared/aiocrm-config.yml"
N8N_START="$HOME/.n8n/start.sh"
NODE_BIN="$HOME/.nvm/versions/node/v20.20.1/bin/node"
TSX_BIN="$PROJECT_DIR/node_modules/.bin/tsx"

mkdir -p "$LOG_DIR"

# ── helpers ──────────────────────────────────────────────────────────────────

ts()  { date '+%H:%M:%S'; }
ok()  { echo -e "$(ts) ${GREEN}✓${NC} $1"; }
warn(){ echo -e "$(ts) ${YELLOW}↻${NC} $1"; }
fail(){ echo -e "$(ts) ${RED}✗${NC} $1"; }
info(){ echo -e "$(ts) ${CYAN}·${NC} $1"; }

port_up() {
  # Returns 0 (true) if something is listening on $1
  lsof -i ":$1" -sTCP:LISTEN -t &>/dev/null
}

ensure_process() {
  local name="$1" grep_pattern="$2" start_cmd="$3" log_file="$4"

  if pgrep -f "$grep_pattern" &>/dev/null; then
    ok "$name is running"
  else
    warn "$name is DOWN — restarting..."
    eval "nohup $start_cmd > '$log_file' 2>&1 &"
    sleep 3
    if pgrep -f "$grep_pattern" &>/dev/null; then
      ok "$name restarted (PID $!)"
    else
      fail "$name failed to start — check $log_file"
    fi
  fi
}

ensure_port() {
  local name="$1" port="$2" filter="$3" log_file="$4"

  if port_up "$port"; then
    ok "$name is up on :$port"
  else
    warn "$name (:$port) is DOWN — restarting..."
    cd "$PROJECT_DIR"
    nohup npx turbo dev --filter="$filter" > "$log_file" 2>&1 &
    local attempts=0
    while ! port_up "$port" && [ $attempts -lt 20 ]; do
      sleep 2; ((attempts++))
    done
    if port_up "$port"; then
      ok "$name restarted on :$port"
    else
      fail "$name failed to come up — check $log_file"
    fi
  fi
}

# ── main check loop ───────────────────────────────────────────────────────────

run_checks() {
  echo ""
  echo -e "${BOLD}── InherentTech Recovery Check ── $(date '+%Y-%m-%d %H:%M:%S') ──${NC}"

  # 1. Cloudflare Tunnel
  ensure_process \
    "Cloudflare Tunnel (aiocrm)" \
    "cloudflared tunnel.*aiocrm-config" \
    "cloudflared tunnel --config '$TUNNEL_CONFIG' run" \
    "$LOG_DIR/tunnel.log"

  # 2. ATS  (port 4001)
  ensure_port \
    "ATS" 4001 "@inherenttech/ats" "$LOG_DIR/ats.log"

  # 3. CRM  (port 4000)
  ensure_port \
    "CRM (aioCRM)" 4000 "@inherenttech/aiocrm" "$LOG_DIR/crm.log"

  # 4. KuduDoc  (port 4002)
  ensure_port \
    "KuduDoc" 4002 "@inherenttech/kudodoc" "$LOG_DIR/docs.log"

  # 5. Job Platform  (port 4003)
  ensure_port \
    "Job Platform" 4003 "@inherenttech/jobplatform" "$LOG_DIR/jobs.log"

  # 6. Web / Admin  (port 4004)
  ensure_port \
    "Web (Admin)" 4004 "@inherenttech/web" "$LOG_DIR/web.log"

  # 7. n8n  (port 5678)
  if port_up 5678; then
    ok "n8n is up on :5678"
  else
    warn "n8n (:5678) is DOWN — restarting..."
    nohup bash "$N8N_START" > "$LOG_DIR/n8n.log" 2>&1 &
    local attempts=0
    while ! port_up 5678 && [ $attempts -lt 15 ]; do
      sleep 2; ((attempts++))
    done
    if port_up 5678; then
      ok "n8n restarted on :5678"
    else
      fail "n8n failed to start — check $LOG_DIR/n8n.log"
    fi
  fi

  # 8. IMAP IDLE Daemon (real-time email trigger for Preeti)
  ensure_process \
    "IMAP IDLE Daemon" \
    "email-idle-daemon" \
    "cd '$PROJECT_DIR/packages/db' && DEFAULT_ORG_ID=f50cd314-0567-4382-ba7e-2b70aecf2a6c '$TSX_BIN' src/email-idle-daemon.ts" \
    "$LOG_DIR/email-idle.log"

  echo ""
}

# ── entry point ───────────────────────────────────────────────────────────────

if [ "$1" = "--watch" ]; then
  info "Watch mode — checking every 60s. Ctrl+C to stop."
  while true; do
    run_checks
    sleep 60
  done
else
  run_checks
fi
