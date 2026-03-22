import { getDb } from './db';
import { execCommand, getAllServers } from './ssh';
import { v4 as uuidv4 } from 'uuid';

interface MetricData {
  cpu: number;
  memory_total: number;
  memory_used: number;
  memory_percent: number;
  disk_json: string;
  load_1: number;
  load_5: number;
  load_15: number;
  uptime: string;
}

interface ServiceData {
  name: string;
  type: string;
  status: string;
  cpu: number;
  memory: number;
  port?: number;
  pid?: number;
  uptime?: string;
  restarts?: number;
}

function isMac(os: string): boolean {
  return os?.toLowerCase().includes('macos') || os?.toLowerCase().includes('darwin');
}

async function collectMetrics(serverId: string, os: string): Promise<MetricData | null> {
  try {
    const mac = isMac(os);
    
    // CPU
    let cpu = 0;
    try {
      if (mac) {
        const raw = await execCommand(serverId, "top -l1 -n0 | grep 'CPU usage'");
        const m = raw.match(/(\d+\.?\d*)% user.*?(\d+\.?\d*)% sys/);
        if (m) cpu = parseFloat(m[1]) + parseFloat(m[2]);
      } else {
        const raw = await execCommand(serverId, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
        cpu = parseFloat(raw) || 0;
      }
    } catch {}

    // Memory
    let memory_total = 0, memory_used = 0, memory_percent = 0;
    try {
      if (mac) {
        const pages = await execCommand(serverId, "vm_stat | head -10");
        const memsize = await execCommand(serverId, "sysctl -n hw.memsize");
        memory_total = Math.round(parseInt(memsize) / 1024 / 1024);
        const activeMatch = pages.match(/Pages active:\s+(\d+)/);
        const wiredMatch = pages.match(/Pages wired down:\s+(\d+)/);
        const compressed = pages.match(/Pages occupied by compressor:\s+(\d+)/);
        const active = parseInt(activeMatch?.[1] || '0') * 16384;
        const wired = parseInt(wiredMatch?.[1] || '0') * 16384;
        const comp = parseInt(compressed?.[1] || '0') * 16384;
        memory_used = Math.round((active + wired + comp) / 1024 / 1024);
        memory_percent = memory_total > 0 ? Math.round((memory_used / memory_total) * 100) : 0;
      } else {
        const raw = await execCommand(serverId, "free -m | grep Mem");
        const parts = raw.trim().split(/\s+/);
        memory_total = parseInt(parts[1]) || 0;
        memory_used = parseInt(parts[2]) || 0;
        memory_percent = memory_total > 0 ? Math.round((memory_used / memory_total) * 100) : 0;
      }
    } catch {}

    // Disk
    let disk_json = '[]';
    try {
      if (mac) {
        const raw = await execCommand(serverId, "df -h / /System/Volumes/Data 2>/dev/null | tail -n +2");
        const disks = raw.trim().split('\n').filter(Boolean).map(line => {
          const p = line.trim().split(/\s+/);
          return { filesystem: p[0], size: p[1], used: p[2], avail: p[3], percent: parseInt(p[4]) || 0, mount: p[8] || p[5] };
        });
        disk_json = JSON.stringify(disks);
      } else {
        const raw = await execCommand(serverId, "df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs 2>/dev/null || df -h");
        const lines = raw.trim().split('\n').slice(1).filter(Boolean);
        const disks = lines.map(line => {
          const p = line.trim().split(/\s+/);
          return { filesystem: p[0], size: p[1], used: p[2], avail: p[3], percent: parseInt(p[4]) || 0, mount: p[5] };
        });
        disk_json = JSON.stringify(disks);
      }
    } catch {}

    // Load
    let load_1 = 0, load_5 = 0, load_15 = 0;
    try {
      const raw = await execCommand(serverId, "uptime");
      const m = raw.match(/load averages?:\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
      if (m) { load_1 = parseFloat(m[1]); load_5 = parseFloat(m[2]); load_15 = parseFloat(m[3]); }
    } catch {}

    // Uptime
    let uptime = '';
    try {
      if (mac) {
        const raw = await execCommand(serverId, "uptime | sed 's/.*up //' | sed 's/,.*//'");
        uptime = raw.trim();
      } else {
        const raw = await execCommand(serverId, "uptime -p 2>/dev/null || uptime");
        uptime = raw.trim().replace('up ', '');
      }
    } catch {}

    return { cpu, memory_total, memory_used, memory_percent, disk_json, load_1, load_5, load_15, uptime };
  } catch {
    return null;
  }
}

async function discoverServices(serverId: string, os: string): Promise<ServiceData[]> {
  const services: ServiceData[] = [];

  // PM2
  try {
    const raw = await execCommand(serverId, "pm2 jlist 2>/dev/null");
    if (raw.trim().startsWith('[')) {
      const pm2List = JSON.parse(raw);
      for (const p of pm2List) {
        services.push({
          name: p.name,
          type: 'pm2',
          status: p.pm2_env?.status || 'unknown',
          cpu: p.monit?.cpu || 0,
          memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
          pid: p.pid,
          uptime: p.pm2_env?.pm_uptime ? new Date(p.pm2_env.pm_uptime).toISOString() : undefined,
          restarts: p.pm2_env?.restart_time || 0,
          port: p.pm2_env?.env?.PORT ? parseInt(p.pm2_env.env.PORT) : undefined,
        });
      }
    }
  } catch {}

  // Systemd (Linux only)
  if (!isMac(os)) {
    try {
      const raw = await execCommand(serverId, "systemctl list-units --type=service --state=running --no-pager --plain --no-legend 2>/dev/null | head -50");
      for (const line of raw.trim().split('\n').filter(Boolean)) {
        const parts = line.trim().split(/\s+/);
        if (parts[0]) {
          services.push({
            name: parts[0].replace('.service', ''),
            type: 'systemd',
            status: 'running',
            cpu: 0,
            memory: 0,
          });
        }
      }
    } catch {}
  }

  // Docker
  try {
    const raw = await execCommand(serverId, 'docker ps --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>/dev/null');
    for (const line of raw.trim().split('\n').filter(Boolean)) {
      const [name, status, ports] = line.split('|');
      if (name) {
        services.push({
          name,
          type: 'docker',
          status: status?.includes('Up') ? 'running' : 'stopped',
          cpu: 0,
          memory: 0,
          port: ports ? parseInt(ports.match(/:(\d+)/)?.[1] || '0') : undefined,
        });
      }
    }
  } catch {}

  return services;
}

export async function collectAll(): Promise<void> {
  const db = getDb();
  const servers = getAllServers();

  const insertMetric = db.prepare(`INSERT INTO metrics (server_id, cpu, memory_total, memory_used, memory_percent, disk_json, load_1, load_5, load_15, uptime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const upsertService = db.prepare(`INSERT INTO services (id, server_id, name, type, status, cpu, memory, port, pid, uptime, restarts, last_seen) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(id) DO UPDATE SET status=excluded.status, cpu=excluded.cpu, memory=excluded.memory, port=excluded.port, pid=excluded.pid, uptime=excluded.uptime, restarts=excluded.restarts, last_seen=datetime('now')`);

  const updateStatus = db.prepare('UPDATE servers SET status = ? WHERE id = ?');

  // Clean old metrics (keep 24h)
  db.prepare("DELETE FROM metrics WHERE timestamp < datetime('now', '-24 hours')").run();

  const promises = servers.map(async (server) => {
    try {
      const metrics = await collectMetrics(server.id, server.os);
      if (metrics) {
        insertMetric.run(server.id, metrics.cpu, metrics.memory_total, metrics.memory_used, metrics.memory_percent, metrics.disk_json, metrics.load_1, metrics.load_5, metrics.load_15, metrics.uptime);
        
        // Check disk alerts
        const disks = JSON.parse(metrics.disk_json || '[]');
        for (const d of disks) {
          if (d.percent >= 95) {
            db.prepare("INSERT INTO alerts (server_id, type, message, severity) VALUES (?, 'disk', ?, 'critical')").run(server.id, `Disk ${d.mount} at ${d.percent}% on ${server.name}`);
          } else if (d.percent >= 90) {
            db.prepare("INSERT INTO alerts (server_id, type, message, severity) VALUES (?, 'disk', ?, 'warning')").run(server.id, `Disk ${d.mount} at ${d.percent}% on ${server.name}`);
          }
        }
        if (metrics.memory_percent >= 90) {
          db.prepare("INSERT INTO alerts (server_id, type, message, severity) VALUES (?, 'memory', ?, 'warning')").run(server.id, `Memory at ${metrics.memory_percent}% on ${server.name}`);
        }

        updateStatus.run('online', server.id);

        // Discover services
        const srvcs = await discoverServices(server.id, server.os);
        for (const s of srvcs) {
          const sid = `${server.id}:${s.type}:${s.name}`;
          upsertService.run(sid, server.id, s.name, s.type, s.status, s.cpu, s.memory, s.port || null, s.pid || null, s.uptime || null, s.restarts || 0);
        }
      } else {
        updateStatus.run('offline', server.id);
      }
    } catch {
      updateStatus.run('offline', server.id);
    }
  });

  await Promise.allSettled(promises);
}

let collectorInterval: ReturnType<typeof setInterval> | null = null;

export function startCollector(intervalMs = 30000) {
  if (collectorInterval) return;
  console.log('[Collector] Starting with interval', intervalMs, 'ms');
  collectAll().catch(console.error);
  collectorInterval = setInterval(() => collectAll().catch(console.error), intervalMs);
}

export function stopCollector() {
  if (collectorInterval) {
    clearInterval(collectorInterval);
    collectorInterval = null;
  }
}
