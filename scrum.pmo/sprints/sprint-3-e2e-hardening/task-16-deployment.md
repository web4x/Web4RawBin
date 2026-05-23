[Back to Sprint 3 Planning](./planning.md)

# T16: Deployment Hardening

**Status:** DONE
**Assigned:** robbin-expert (implement), robbin-tester (verify)
**Effort:** 2h expert + 1h tester
**Dependencies:** Port 4444 forwarded (Tron action)

## Goal

Make RawBin production-ready: reliable process management, proper SSL, log persistence, health monitoring.

## Requirements

### 16.1 Start script (src/sh/rawbin.sh)

- Starts server with proper NODE_ENV=production
- Redirects stdout/stderr to log file
- PID file for process management
- Auto-restart on crash (simple loop or use PM2/systemd)

### 16.2 Stop script (src/sh/stop.sh)

- Reads PID file, sends SIGTERM
- Waits for graceful shutdown
- Cleans up PID file

### 16.3 SSL certificate

- Check if OOSH `certificates` script can provide a real cert (Let's Encrypt or similar)
- Or use the existing self-signed cert (requires browser trust exception)
- Document how to install a proper cert in .certs/

### 16.4 Log persistence

- Write server logs to `data/logs/rawbin-YYYY-MM-DD.log`
- Rotate daily, keep 7 days
- TUI still shows live logs in memory

### 16.5 Health check endpoint

```
GET /api/health → { status: 'ok', uptime: N, version: '0.1.0', connections: N, rooms: N }
```

### 16.6 Environment config

- .env supports: NODE_ENV, LOG_LEVEL, MAX_ROOMS, MAX_MEMBERS_PER_ROOM
- Development mode: verbose logging, TUI enabled
- Production mode: file logging, TUI disabled (headless)

## Acceptance Criteria
- [x] `./src/sh/rawbin.sh` starts server reliably
- [x] Server restarts on crash
- [x] Logs written to disk
- [x] GET /api/health returns server status
- [x] External access works at https://home.donges.it:4444/app
