import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.join(process.cwd(), 'fleetdeck.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
    seedIfEmpty(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hostname TEXT,
      ips TEXT DEFAULT '[]',
      ssh_host TEXT,
      ssh_port INTEGER DEFAULT 22,
      ssh_user TEXT,
      ssh_password_encrypted TEXT,
      os TEXT,
      role TEXT,
      tags TEXT DEFAULT '[]',
      is_local INTEGER DEFAULT 0,
      status TEXT DEFAULT 'unknown',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      cpu REAL,
      memory_total INTEGER,
      memory_used INTEGER,
      memory_percent REAL,
      disk_json TEXT DEFAULT '[]',
      load_1 REAL,
      load_5 REAL,
      load_15 REAL,
      uptime TEXT,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_server_time ON metrics(server_id, timestamp);

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      server_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'unknown',
      cpu REAL DEFAULT 0,
      memory REAL DEFAULT 0,
      port INTEGER,
      pid INTEGER,
      uptime TEXT,
      restarts INTEGER DEFAULT 0,
      last_seen TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      acknowledged INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT NOT NULL,
      service_name TEXT,
      git_repo TEXT,
      branch TEXT,
      commit_hash TEXT,
      deployed_at TEXT DEFAULT (datetime('now')),
      deployed_by TEXT DEFAULT 'system',
      log TEXT,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    CREATE TABLE IF NOT EXISTS command_snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT,
      name TEXT NOT NULL,
      command TEXT NOT NULL,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    );

    CREATE TABLE IF NOT EXISTS alert_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      threshold REAL NOT NULL,
      severity TEXT DEFAULT 'warning',
      enabled INTEGER DEFAULT 1
    );
  `);
}

function getMasterKey(): Buffer {
  const key = process.env.FLEETDECK_MASTER_KEY || 'fleetdeck-dev-key-change-me-in-production!';
  return crypto.createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', getMasterKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + tag.toString('hex');
}

export function decrypt(encrypted: string): string {
  const [ivHex, encHex, tagHex] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getMasterKey(), iv);
  decipher.setAuthTag(tag);
  return decipher.update(enc) + decipher.final('utf8');
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM servers').get() as { c: number };
  if (count.c > 0) return;

  const servers = [
    { id: 'pu2', name: 'PU2 (Mac Studio)', ips: JSON.stringify(['10.10.10.123', '192.168.195.33']), ssh_host: 'localhost', ssh_user: 'noc', ssh_password_encrypted: '', os: 'macOS', role: 'Primary NOC workstation', tags: JSON.stringify(['macos', 'primary']), is_local: 1 },
    { id: 'phoenix', name: 'Phoenix VPS', ips: JSON.stringify(['142.202.191.208']), ssh_host: '142.202.191.208', ssh_user: 'root', ssh_password_encrypted: encrypt('c5U6667Z3X67'), os: 'Ubuntu 24.04', role: 'ANPR, WireGuard hub, app hosting', tags: JSON.stringify(['ubuntu', 'vps', 'anpr']), is_local: 0 },
    { id: 'dynu', name: 'Dynu VPS', ips: JSON.stringify(['172.81.61.36']), ssh_host: '172.81.61.36', ssh_user: 'root', ssh_password_encrypted: encrypt('2d6e4UVW3Wc3'), os: 'Ubuntu 24.04', role: 'Web hosting, marketing sites', tags: JSON.stringify(['ubuntu', 'vps', 'web']), is_local: 0 },
    { id: 'delta', name: 'Delta (MacBook Air M4)', ips: JSON.stringify(['10.10.10.238', '192.168.195.165']), ssh_host: '10.10.10.238', ssh_user: 'noc', ssh_password_encrypted: '', os: 'macOS', role: 'POS host', tags: JSON.stringify(['macos', 'pos']), is_local: 0 },
    { id: 'charlie', name: 'Charlie (MacBook Air M4)', ips: JSON.stringify(['10.10.10.184', '192.168.195.242']), ssh_host: '10.10.10.184', ssh_user: 'noc', ssh_password_encrypted: '', os: 'macOS', role: 'Secondary', tags: JSON.stringify(['macos']), is_local: 0 },
    { id: 'noc-pi', name: 'NOC Pi', ips: JSON.stringify(['192.168.195.238']), ssh_host: '192.168.195.238', ssh_user: 'pi', ssh_password_encrypted: encrypt('pi'), os: 'Raspberry Pi OS', role: 'Vision/Hailo-8', tags: JSON.stringify(['rpi', 'hailo']), is_local: 0 },
    { id: 'van-pi', name: 'Van Pi', ips: JSON.stringify(['192.168.195.161', '10.42.42.161']), ssh_host: '192.168.195.161', ssh_user: 'wispayr', ssh_password_encrypted: encrypt('WispAyr2026!'), os: 'Raspberry Pi OS', role: 'Mobile command unit', tags: JSON.stringify(['rpi', 'hailo', 'mobile']), is_local: 0 },
  ];

  const insert = db.prepare(`INSERT INTO servers (id, name, ips, ssh_host, ssh_user, ssh_password_encrypted, os, role, tags, is_local) VALUES (@id, @name, @ips, @ssh_host, @ssh_user, @ssh_password_encrypted, @os, @role, @tags, @is_local)`);
  
  for (const s of servers) {
    insert.run(s);
  }

  // Seed default alert config
  const insertAlert = db.prepare('INSERT INTO alert_config (metric, threshold, severity) VALUES (?, ?, ?)');
  insertAlert.run('disk_percent', 85, 'warning');
  insertAlert.run('disk_percent', 90, 'critical');
  insertAlert.run('disk_percent', 95, 'critical');
  insertAlert.run('memory_percent', 90, 'warning');
  insertAlert.run('cpu_percent', 95, 'warning');
}
