#!/usr/bin/env bash
# Start the VietnamCV stack locally in one command.
#
#   scripts/run.sh            check prerequisites, build and start everything, print URLs
#   scripts/run.sh --open     same, then open the site in the browser
#   scripts/run.sh update     git pull, then rebuild and restart only what the new commits change
#   scripts/run.sh down       stop the stack (keeps database volumes)
#   scripts/run.sh logs       follow logs from all services
#   scripts/run.sh status     show container status
#   scripts/run.sh admin [NAME]  create an admin account (default: admin) or set its password
#   scripts/run.sh tts [ARGS]    record the Knowledge read-aloud audio with VieNeu-TTS (ADR-018)
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

usage() { sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

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
  [ "$seed" = "yes" ] && info "Seed data (news or demos) changed; it will be re-imported"

  info "Restarting changed services"
  compose up --detach --wait ||
    die "Restarting the stack failed (a service is unhealthy: scripts/run.sh status)"
  wait_for "$API_URL/api/v1/health/ready" "API"
  wait_for "$WEB_URL/vi" "Web"
  record_built
  print_urls
}

# Creates the admin account that signs in at /vi/admin, or sets a new password on it.
# The password is typed into the API container, never stored in a file (ADR-015).
admin() {
  local name="$1"
  check_docker
  [ -n "$(compose ps --status running --quiet api 2>/dev/null || true)" ] ||
    die "The API is not running. Start the stack first: scripts/run.sh"
  info "Admin account '$name': type a password (at least 10 characters)"
  compose exec api python -m app.cli.create_admin "$name" ||
    die "Could not save the admin account (see the message above)"
  ok "Sign in at $WEB_URL/vi/admin"
}

# Renders the read-aloud MP3s of the Knowledge articles on this computer (CPU is enough;
# no GPU needed) into apps/web/public/knowledge/audio. Only changed sections are redone.
# Arguments go to tools/knowledge-tts/generate.py, e.g. --locale vi en, --voice "Thái Sơn".
tts() {
  local dir="$ROOT_DIR/tools/knowledge-tts" python="" candidate
  for candidate in python3.13 python3.12 python3.11 python3.10 python3; do
    if command -v "$candidate" >/dev/null 2>&1 &&
      "$candidate" -c 'import sys; sys.exit(sys.version_info < (3, 10))' 2>/dev/null; then
      python="$candidate"
      break
    fi
  done
  [ -n "$python" ] || die "Python 3.10 or newer not found. On macOS: brew install python@3.12"

  if [ ! -x "$dir/.venv/bin/python" ]; then
    info "Creating a Python environment for VieNeu-TTS in tools/knowledge-tts/.venv"
    "$python" -m venv "$dir/.venv" || die "Could not create the virtual environment"
  fi
  info "Installing VieNeu-TTS (first time only, a few minutes)"
  "$dir/.venv/bin/python" -m pip install --quiet --upgrade pip
  "$dir/.venv/bin/python" -m pip install --quiet -r "$dir/requirements.txt" ||
    die "pip install failed (see the output above)"

  info "Recording the Knowledge sections"
  "$dir/.venv/bin/python" "$dir/generate.py" "$@" || die "Recording failed (see the output above)"
  ok "Audio saved in apps/web/public/knowledge/audio"

  # The web image bakes public/ in, so a running stack needs the web image rebuilt.
  if command -v docker >/dev/null 2>&1 &&
    [ -n "$(compose ps --status running --quiet web 2>/dev/null || true)" ]; then
    info "Rebuilding the web image so the site plays the new audio"
    compose build web || die "Build failed (see output above)"
    compose up --detach --wait web || die "Restarting web failed (scripts/run.sh status)"
    wait_for "$WEB_URL/vi/knowledge/cnn" "Web"
  fi
  ok "Commit the audio with: git add apps/web/public/knowledge apps/web/src/content/knowledge-audio.json"
}

main() {
  cd "$ROOT_DIR"
  local cmd="up" open_browser="no" admin_name="admin" arg
  if [ "${1:-}" = "tts" ]; then
    shift
    tts "$@"
    return
  fi
  for arg in "$@"; do
    if [ "$cmd" = "admin" ] && [ "${arg#-}" = "$arg" ]; then
      admin_name="$arg"
      continue
    fi
    case "$arg" in
      up | start) cmd="up" ;;
      down | stop) cmd="down" ;;
      update | pull) cmd="update" ;;
      logs) cmd="logs" ;;
      status | ps) cmd="status" ;;
      admin) cmd="admin" ;;
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
    admin) admin "$admin_name" ;;
  esac
}

# One line, so bash has parsed it before `update` lets git pull rewrite this file.
main "$@"; exit $?
