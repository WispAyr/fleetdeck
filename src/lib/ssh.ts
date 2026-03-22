import { Client, ConnectConfig } from 'ssh2';
import { exec as localExec } from 'child_process';
import { getDb, decrypt } from './db';

interface ServerRecord {
  id: string;
  name: string;
  ssh_host: string;
  ssh_user: string;
  ssh_password_encrypted: string;
  is_local: number;
  os: string;
}

const connectionPool: Map<string, Client> = new Map();

export function getServer(id: string): ServerRecord | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM servers WHERE id = ?').get(id) as ServerRecord | undefined;
}

export function getAllServers(): ServerRecord[] {
  const db = getDb();
  return db.prepare('SELECT * FROM servers').all() as ServerRecord[];
}

function getConnectConfig(server: ServerRecord): ConnectConfig {
  const config: ConnectConfig = {
    host: server.ssh_host,
    port: 22,
    username: server.ssh_user,
    readyTimeout: 10000,
    keepaliveInterval: 10000,
  };
  if (server.ssh_password_encrypted) {
    config.password = decrypt(server.ssh_password_encrypted);
  } else {
    // Key-based auth — use agent
    config.agent = process.env.SSH_AUTH_SOCK;
  }
  return config;
}

export function execCommand(serverId: string, command: string, timeoutMs = 10000): Promise<string> {
  const server = getServer(serverId);
  if (!server) return Promise.reject(new Error(`Server ${serverId} not found`));

  if (server.is_local) {
    return new Promise((resolve, reject) => {
      const child = localExec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
        if (err && !stdout) return reject(err);
        resolve(stdout || stderr || '');
      });
    });
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SSH command timeout')), timeoutMs);
    
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) { clearTimeout(timer); conn.end(); return reject(err); }
        let output = '';
        stream.on('data', (data: Buffer) => { output += data.toString(); });
        stream.stderr.on('data', (data: Buffer) => { output += data.toString(); });
        stream.on('close', () => {
          clearTimeout(timer);
          conn.end();
          resolve(output);
        });
      });
    });
    conn.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    conn.connect(getConnectConfig(server));
  });
}

export function getSSHStream(serverId: string): Promise<{ conn: Client; stream: NodeJS.ReadWriteStream }> {
  const server = getServer(serverId);
  if (!server) return Promise.reject(new Error(`Server ${serverId} not found`));

  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.shell((err, stream) => {
        if (err) { conn.end(); return reject(err); }
        resolve({ conn, stream });
      });
    });
    conn.on('error', reject);
    conn.connect(getConnectConfig(server));
  });
}
