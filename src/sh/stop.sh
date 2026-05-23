#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
PID_FILE="$PROJECT_DIR/data/rawbin.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "No PID file found. Server may not be running."
  exit 0
fi

PID=$(cat "$PID_FILE")

if ! kill -0 "$PID" 2>/dev/null; then
  echo "Process $PID not found. Cleaning up stale PID file."
  rm -f "$PID_FILE"
  exit 0
fi

echo "Stopping RawBin server (PID $PID)..."
kill -TERM "$PID"

for i in $(seq 1 10); do
  if ! kill -0 "$PID" 2>/dev/null; then
    echo "Server stopped."
    rm -f "$PID_FILE"
    exit 0
  fi
  sleep 1
done

echo "Server did not stop gracefully. Sending SIGKILL..."
kill -9 "$PID" 2>/dev/null || true
rm -f "$PID_FILE"
echo "Server killed."
