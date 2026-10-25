#!/usr/bin/env bash
# Start the VietnamCV stack locally in one command.
#
#   scripts/run.sh            check prerequisites, build and start everything, print URLs
#   scripts/run.sh --open     same, then open the site in the browser
#   scripts/run.sh update     git pull, then rebuild and restart only what the new commits change
#   scripts/run.sh down       stop the stack (keeps database volumes)
#   scripts/run.sh logs       follow logs from all services
#   scripts/run.sh status     show container status
#
# Works with Docker Desktop or Colima on macOS and with Docker Engine on Linux.
# Written for bash 3.2 so it runs with the bash that ships with macOS.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/compose/compose.yaml"
ENV_FILE="$ROOT_DIR/.env"
WEB_URL="http://localhost:3000"
API_URL="http://localhost:8000"

if [ -t 1 ]; then
  BOLD=$'\033[1m' GREEN=$'\033[32m' YELLOW=$'\033[33m' RED=$'\033[31m' RESET=$'\033[0m'
else
  BOLD="" GREEN="" YELLOW="" RED="" RESET=""
fi

info() { printf '%s==>%s %s\n' "$BOLD" "$RESET" "$*"; }
ok() { printf '%s  ok%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%swarn%s %s\n' "$YELLOW" "$RESET" "$*" >&2; }
die() {
  printf '%serror%s %s\n' "$RED" "$RESET" "$*" >&2
  exit 1
}

usage() { sed -n '2,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

compose() {
  if [ -f "$ENV_FILE" ]; then
    docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
  else
    docker compose -f "$COMPOSE_FILE" "$@"
  fi
}

check_docker() {
  command -v docker >/dev/null 2>&1 ||
    die "Docker CLI not found. On macOS: brew install colima docker docker-compose && colima start"

  if ! docker info >/dev/null 2>&1; then
    if command -v colima >/dev/null 2>&1; then
      info "Docker daemon is not running; starting Colima (first start takes a minute)"
      colima start || die "colima start failed. Run 'colima status' or 'colima start --verbose' to see why."
    else
      die "Docker daemon is not running. Start Docker Desktop (or install Colima: brew install colima && colima start)."
    fi
    docker info >/dev/null 2>&1 || die "Docker daemon is still unreachable. Check 'docker context ls'."
  fi
  ok "Docker daemon is running ($(docker context show 2>/dev/null || echo default) context)"

  docker compose version >/dev/null 2>&1 ||
    die "Docker Compose v2 not found. On macOS with Colima: brew install docker-compose, then add
     \"cliPluginsExtraDirs\": [\"$(brew --prefix 2>/dev/null || echo /opt/homebrew)/lib/docker/cli-plugins\"]
     to ~/.docker/config.json"
  ok "Docker Compose $(docker compose version --short 2>/dev/null)"
}

check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$ROOT_DIR/.env.example" "$ENV_FILE"
    warn "Created .env from .env.example (local placeholders; edit it to set Google sign-in)"
  else
    ok ".env found"
  fi
}

# Fails early when another program holds a port the stack needs. Ports already held by
# this stack's own containers are fine: `compose up` just recreates them.
check_ports() {
  command -v lsof >/dev/null 2>&1 || return 0
  local running port busy=""
  running="$(compose ps --status running --quiet 2>/dev/null || true)"
  [ -n "$running" ] && return 0
  for port in 3000 8000 5432 6379; do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      busy="$busy $port"
    fi
  done
  [ -z "$busy" ] && return 0
  die "Port(s)$busy already in use. Stop the program using them (lsof -nP -iTCP:<port> -sTCP:LISTEN) and retry."
}

wait_for() {
  local url="$1" name="$2" tries=60
  command -v curl >/dev/null 2>&1 || return 0
  until curl -fsS -o /dev/null "$url"; do
    tries=$((tries - 1))
    [ "$tries" -le 0 ] && die "$name did not answer at $url. See: scripts/run.sh logs"
    sleep 2
  done
  ok "$name is up"
}

up() {
  local open_browser="$1"
  info "Checking prerequisites"
  check_docker
  check_env
  check_ports

  info "Building images and starting the stack (the first build takes several minutes)"
  compose up --build --detach --wait ||
    die "Starting the stack failed (build error above, or a service is unhealthy: scripts/run.sh status)"

  wait_for "$API_URL/api/v1/health/ready" "API"
  wait_for "$WEB_URL/vi" "Web"
  record_built

  print_urls

  if [ "$open_browser" = "yes" ]; then
    if command -v open >/dev/null 2>&1; then
      open "$WEB_URL/vi"
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$WEB_URL/vi" >/dev/null 2>&1 &
    fi
  fi
}

print_urls() {
  printf '\n%sVietnamCV is running%s\n' "$BOLD" "$RESET"
  printf '  Web:       %s/vi\n' "$WEB_URL"
  printf '  News:      %s/vi/news\n' "$WEB_URL"
  printf '  API docs:  %s/api/v1/docs\n' "$API_URL"
  printf '  Readiness: %s/api/v1/health/ready\n' "$API_URL"
  printf '\nLogs: scripts/run.sh logs    Stop: scripts/run.sh down\n'
}

# The commit the running images were last built from, kept inside .git so it is never
# committed. `update` diffs against it, so a manual `git pull` before `update` still
# rebuilds what changed.
built_file() { git rev-parse --git-path vietnamcv-built-commit 2>/dev/null; }
record_built() {
  command -v git >/dev/null 2>&1 || return 0
  git rev-parse HEAD >"$(built_file)" 2>/dev/null || true
}

# The images bake the code in (no bind mounts), so pulled code only shows up after a
# rebuild. Rebuild just the images whose build inputs changed; `compose up` then
# recreates their containers and re-runs migrate and seed (both idempotent).
update() {
  local built="" after changed api="no" web="no" stack="no" seed="no" migrations="no" file
  local -a services=()

  command -v git >/dev/null 2>&1 || die "git not found"
  info "Pulling the latest code"
  git pull --ff-only || die "git pull failed. Commit or stash local changes (git status), then retry."
  after="$(git rev-parse HEAD)"

  check_docker
  check_env

  if [ -z "$(compose ps --status running --quiet 2>/dev/null || true)" ]; then
    info "The stack is not running; starting it"
    up "no"
    return
  fi

  [ -f "$(built_file)" ] && built="$(cat "$(built_file)")"
  if [ -n "$built" ] && git cat-file -e "$built^{commit}" 2>/dev/null; then
    if [ "$built" = "$after" ]; then
      ok "Running images already match $(git rev-parse --short HEAD); nothing to rebuild"
      return
    fi
    changed="$(git diff --name-only "$built" "$after")"
  else
    # Unknown build commit (stack started before this command existed): rebuild both.
    info "Build commit of the running images is unknown; rebuilding everything once"
    changed="services/api/
apps/web/"
  fi
  while IFS= read -r file; do
    case "$file" in
      services/api/seed/*) api="yes" seed="yes" ;;
      services/api/alembic/*) api="yes" migrations="yes" ;;
      services/api/* | infra/docker/api.Dockerfile) api="yes" ;;
      apps/web/* | packages/* | package.json | pnpm-lock.yaml | pnpm-workspace.yaml | \
        infra/docker/web.Dockerfile) web="yes" ;;
      infra/compose/* | .dockerignore) stack="yes" ;;
    esac
  done <<EOF_CHANGED
$changed
EOF_CHANGED

  [ "$api" = "yes" ] && services+=(api)
  [ "$web" = "yes" ] && services+=(web)

  if [ "${#services[@]}" -eq 0 ] && [ "$stack" = "no" ]; then
    ok "$(git rev-parse --short "$built")..$(git rev-parse --short "$after"): no app changes, nothing to rebuild"
    record_built
    return
  fi

  if [ "${#services[@]}" -gt 0 ]; then
    info "Rebuilding: ${services[*]}"
    compose build "${services[@]}" || die "Build failed (see output above)"
  fi
  [ "$migrations" = "yes" ] && info "New migrations will be applied"
  [ "$seed" = "yes" ] && info "News seed data changed; it will be re-imported"

  info "Restarting changed services"
  compose up --detach --wait ||
    die "Restarting the stack failed (a service is unhealthy: scripts/run.sh status)"
  wait_for "$API_URL/api/v1/health/ready" "API"
  wait_for "$WEB_URL/vi" "Web"
  record_built
  print_urls
}

main() {
  cd "$ROOT_DIR"
  local cmd="up" open_browser="no" arg
  for arg in "$@"; do
    case "$arg" in
      up | start) cmd="up" ;;
      down | stop) cmd="down" ;;
      update | pull) cmd="update" ;;
      logs) cmd="logs" ;;
      status | ps) cmd="status" ;;
      --open | -o) open_browser="yes" ;;
      -h | --help | help)
        usage
        exit 0
        ;;
      *)
        usage >&2
        die "Unknown argument: $arg"
        ;;
    esac
  done

  case "$cmd" in
    up) up "$open_browser" ;;
    update) update ;;
    down)
      compose down
      ok "Stack stopped (database volumes kept)"
      ;;
    logs) compose logs -f ;;
    status) compose ps ;;
  esac
}

# One line, so bash has parsed it before `update` lets git pull rewrite this file.
main "$@"; exit $?
