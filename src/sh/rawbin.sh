#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATA_DIR="$PROJECT_DIR/data"
LOGS_DIR="$DATA_DIR/logs"
PID_FILE="$DATA_DIR/rawbin.pid"

mkdir -p "$LOGS_DIR"

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "RawBin already running (PID $OLD_PID). Use stop.sh first."
    exit 1
  fi
  rm -f "$PID_FILE"
fi

cd "$PROJECT_DIR"
npm run build 2>/dev/null || true

LOG_DATE=$(date +%Y-%m-%d)
LOG_FILE="$LOGS_DIR/rawbin-$LOG_DATE.log"

echo "[$(date)] Starting RawBin server..." | tee -a "$LOG_FILE"

export NODE_ENV=production

while true; do
  echo "[$(date)] Server starting..." >> "$LOG_FILE"
  npx tsx src/ts/server/server.ts >> "$LOG_FILE" 2>&1 &
  SERVER_PID=$!
  echo "$SERVER_PID" > "$PID_FILE"
  echo "[$(date)] Server PID: $SERVER_PID" | tee -a "$LOG_FILE"

  wait "$SERVER_PID" || true
  EXIT_CODE=$?

  rm -f "$PID_FILE"

  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Server stopped cleanly." | tee -a "$LOG_FILE"
    break
  fi

  echo "[$(date)] Server crashed (exit $EXIT_CODE). Restarting in 3s..." | tee -a "$LOG_FILE"
  sleep 3

  LOG_DATE=$(date +%Y-%m-%d)
  LOG_FILE="$LOGS_DIR/rawbin-$LOG_DATE.log"
done
