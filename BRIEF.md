# FleetDeck Build Brief

## What
Server & service management dashboard. Single-pane view of 7 servers.
Runs on localhost:3950. Dark NOC theme. No agents on remote servers — all via SSH.

## Tech Stack
- Next.js 14+ (App Router) with TypeScript
- Tailwind CSS (dark theme)
- SQLite via better-sqlite3
- ssh2 for remote execution
- WebSockets (ws or socket.io) for live updates
- xterm.js for web terminal
- Chart.js for time series
- crypto (node built-in) for credential encryption

## Architecture
- Web UI on :3950
- Collector service runs periodically (every 30s), SSHes into servers, caches metrics in SQLite
- WebSocket pushes updates to dashboard
- SSH pool for reusable connections

## Database Schema (SQLite)
- servers: id, name, hostname, ips (JSON), ssh_user, ssh_password_encrypted, os, role, tags, created_at
- metrics: id, server_id, timestamp, cpu, memory, disk_json, load_avg, uptime
- services: id, server_id, name, type (pm2/systemd/docker/nginx), status, cpu, memory, port, last_seen
- alerts: id, server_id, type, message, severity, created_at, acknowledged
- deployments: id, server_id, service_name, git_repo, branch, commit, deployed_at, deployed_by
- command_snippets: id, server_id, name, command

## Seed Servers (pre-configure in DB on first run)
1. PU2 (Mac Studio) - 10.10.10.123 / 192.168.195.33 - local (no SSH) - macOS - Primary NOC
2. Phoenix VPS - 142.202.191.208 - root/c5U6667Z3X67 - Ubuntu 24.04 - ANPR/WireGuard
3. Dynu VPS - 172.81.61.36 - root/2d6e4UVW3Wc3 - Ubuntu 24.04 - Web hosting
4. Delta (MacBook Air M4) - 10.10.10.238 / 192.168.195.165 - noc (no password, key-based) - macOS - POS
5. Charlie (MacBook Air M4) - 10.10.10.184 / 192.168.195.242 - noc (no password, key-based) - macOS - Secondary
6. NOC Pi - 192.168.195.238 - pi/pi - RPi OS - Vision/Hailo-8
7. Van Pi - 192.168.195.161 / 10.42.42.161 - wispayr/WispAyr2026! - RPi OS - Mobile command

## Encryption
Use FLEETDECK_MASTER_KEY env var (or generate one on first run saved to .env).
AES-256-GCM for SSH passwords at rest.

## Pages/Routes
- / — Dashboard (server grid with health cards)
- /servers — Server registry (add/edit/delete)
- /servers/[id] — Server detail (metrics, services, disk, deployments)
- /services — All services across all servers
- /network — WireGuard/ZeroTier status, topology
- /alerts — Alert history + configuration
- /terminal — Web SSH terminal (server selector + xterm.js)
- /deployments — Deploy tracker + quick deploy

## UI Design
- Dark theme (#0a0a0f background, #1a1a2e cards)
- Monospace for metrics (JetBrains Mono or similar)
- Inter for labels
- Green=#22c55e, Amber=#f59e0b, Red=#ef4444, Grey=#6b7280
- Compact, dense, Grafana-inspired
- Sidebar navigation
- Desktop-first, responsive

## API Routes (Next.js API routes)
- GET/POST /api/servers — CRUD
- GET /api/servers/[id]/metrics — time series
- GET /api/servers/[id]/services — discovered services
- POST /api/servers/[id]/services/[name]/action — start/stop/restart
- GET /api/servers/[id]/disk — disk breakdown
- GET /api/servers/[id]/nginx — nginx sites + SSL
- GET /api/servers/[id]/databases — postgres overview
- GET /api/alerts — alert list
- POST /api/alerts/config — update thresholds
- GET /api/deployments — deploy log
- POST /api/deploy — trigger deployment
- WS /api/ws — live metric updates

## Collector Commands (run via SSH)
- CPU: top -bn1 | grep "Cpu(s)" (Linux) / top -l1 | grep "CPU usage" (macOS)
- Memory: free -m (Linux) / vm_stat (macOS)
- Disk: df -h --output=source,size,used,avail,pcent,target (Linux) / df -h (macOS)
- Load: uptime
- PM2: pm2 jlist
- Systemd: systemctl list-units --type=service --state=running --no-pager --plain
- Docker: docker ps --format json
- Nginx: ls /etc/nginx/sites-enabled/ + nginx -T for config
- SSL: openssl x509 -in cert.pem -noout -enddate
- Postgres: psql -c "SELECT datname, pg_database_size(datname) FROM pg_database"
- WireGuard: wg show
- Git deploy info: git -C /path rev-parse HEAD, git -C /path log -1 --format=%ci

## Important
- PU2 is localhost — use child_process.exec instead of SSH
- For macOS servers, commands differ from Linux (handle both)
- Handle SSH connection failures gracefully (show server as offline)
- The collector should NOT block — timeout after 10s per server
- Start the collector automatically when the app starts
