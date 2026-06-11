### R19.41: Server has a configurable log level that gates logging detail at runtime.

<details><summary>Tron directive</summary>

> The server MUST have a configurable LOG LEVEL with standard verbosity tiers (error < warn < info < debug < trace). All server logging (including the file-upload/createFileUnit diligent logging from R19.36) respects the active level — messages below the threshold are suppressed. The level MUST be settable at runtime without server restart (e.g. via admin API endpoint or WS command) AND have a persisted default (env var or config file read at startup). This enables increasing detail for debugging and decreasing for production noise.

</details>

## Traceability

**Tasks:**
- [🔗 T-server-log-level: configurable server log level gates logging verbosity](../task/server-log-level-configurable-gates-logging.md)

**UseCases:**
- [🔗 server.leveledLog](../usecase/server-leveledlog.md)
