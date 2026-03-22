export interface Server {
  id: string;
  name: string;
  hostname: string;
  ips: string[];
  ssh_host: string;
  ssh_port: number;
  ssh_user: string;
  os: string;
  role: string;
  tags: string[];
  is_local: number;
  status: string;
  created_at: string;
}

export interface Metric {
  id: number;
  server_id: string;
  timestamp: string;
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

export interface Service {
  id: string;
  server_id: string;
  name: string;
  type: string;
  status: string;
  cpu: number;
  memory: number;
  port: number | null;
  pid: number | null;
  uptime: string | null;
  restarts: number;
  last_seen: string;
}

export interface Alert {
  id: number;
  server_id: string;
  type: string;
  message: string;
  severity: string;
  acknowledged: number;
  created_at: string;
  server_name?: string;
}

export interface Deployment {
  id: number;
  server_id: string;
  service_name: string;
  git_repo: string;
  branch: string;
  commit_hash: string;
  deployed_at: string;
  deployed_by: string;
  log: string;
  server_name?: string;
}

export interface DiskInfo {
  filesystem: string;
  size: string;
  used: string;
  avail: string;
  percent: number;
  mount: string;
}
