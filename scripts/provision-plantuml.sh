#!/usr/bin/env bash
# Provision the PlantUML render backend for RawBin's Compile→SVG (/api/puml-render).
# WHY THIS EXISTS: the render shells to a plantuml-server Docker, NOT a host binary.
# This dep is invisible to git and gets lost across rewinds/host-rebuilds ("you forgot?").
# Run this on the SAME host as the RawBin server (so localhost:8089 resolves).
# The RawBin server reads the URL from typed-config (plantumlUrl / env PLANTUML_URL),
# default http://localhost:8089 — keep the port in sync if you change it here.
set -euo pipefail

NAME=plantuml-server
PORT=8089            # host port -> 8080 in container; must match Config plantumlUrl
IMAGE=plantuml/plantuml-server:jetty

# Idempotent: remove any prior instance first.
docker rm -f "$NAME" 2>/dev/null || true

# NOTE the flags: plantuml-server is a JVM app. On hosts with a restrictive
# seccomp/nproc policy the JVM crash-loops on "pthread_create failed (EPERM) /
# cannot create GC thread". seccomp=unconfined + raised nproc + a constrained
# serial-GC JVM lets it boot. Do NOT drop these on such hosts.
docker run -d --name "$NAME" --restart unless-stopped \
  -p "${PORT}:8080" \
  --security-opt seccomp=unconfined \
  --ulimit nproc=8192 --ulimit nofile=8192 \
  --memory 1g \
  -e JAVA_OPTIONS="-XX:+UseSerialGC -XX:ActiveProcessorCount=1 -Xmx512m" \
  "$IMAGE"

echo "plantuml-server provisioned on :${PORT}. Verify:"
echo "  curl -s -o /dev/null -w '%{http_code} %{content_type}\\n' http://localhost:${PORT}/svg/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000"
echo "  (expect: 200 image/svg+xml)"
