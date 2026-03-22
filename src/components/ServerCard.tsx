'use client';

interface ServerCardProps {
  server: any;
  onClick?: () => void;
}

function statusColor(status: string) {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'warning': return 'bg-amber-500';
    case 'critical': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function barColor(pct: number) {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 75) return 'bg-amber-500';
  return 'bg-cyan-500';
}

function Bar({ label, value, max }: { label: string; value: number; max?: number }) {
  const pct = max ? Math.round((value / max) * 100) : value;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-gray-500 w-10 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-gray-400 w-10 text-right font-mono">{pct}%</span>
    </div>
  );
}

export default function ServerCard({ server, onClick }: ServerCardProps) {
  const m = server.latest_metric;
  const disks = m ? JSON.parse(m.disk_json || '[]') : [];
  const mainDisk = disks[0];

  return (
    <div onClick={onClick}
      className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-3 hover:border-cyan-500/30 cursor-pointer transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColor(server.status)} ${server.status === 'online' ? 'animate-pulse' : ''}`} />
          <h3 className="text-sm font-semibold text-gray-200 group-hover:text-cyan-400 transition-colors">{server.name}</h3>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">{server.os}</span>
      </div>
      
      <p className="text-[10px] text-gray-500 mb-2 truncate">{server.role}</p>
      
      {m ? (
        <div className="space-y-1.5">
          <Bar label="CPU" value={Math.round(m.cpu)} />
          <Bar label="RAM" value={m.memory_percent} />
          {mainDisk && <Bar label="Disk" value={mainDisk.percent} />}
          <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 pt-1.5 border-t border-[#1e1e3a]">
            <span>Load: {m.load_1?.toFixed(1)}</span>
            <span>{server.service_count} services</span>
            <span>Up: {m.uptime?.split(',')[0]}</span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-gray-600 py-4 text-center">
          {server.status === 'offline' ? 'Offline' : 'Awaiting data...'}
        </div>
      )}
    </div>
  );
}
