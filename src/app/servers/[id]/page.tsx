'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ServerDetailPage() {
  const { id } = useParams();
  const [server, setServer] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/servers').then(r => r.json()).then(data => {
      setServer(data.find((s: any) => s.id === id));
    });
    fetch(`/api/servers/${id}/metrics`).then(r => r.json()).then(setMetrics);
    fetch(`/api/servers/${id}/services`).then(r => r.json()).then(setServices);
  }, [id]);

  const handleServiceAction = async (svc: any, action: string) => {
    setActionLoading(`${svc.id}:${action}`);
    try {
      await fetch(`/api/servers/${id}/services/${encodeURIComponent(svc.name)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, type: svc.type }),
      });
      // Refresh services
      const res = await fetch(`/api/servers/${id}/services`);
      setServices(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!server) return <div className="text-gray-500">Loading...</div>;

  const m = server.latest_metric;
  const disks = m ? JSON.parse(m.disk_json || '[]') : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/servers" className="text-gray-500 hover:text-gray-300">← Servers</Link>
        <div className={`w-3 h-3 rounded-full ${server.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
        <h1 className="text-2xl font-bold">{server.name}</h1>
        <span className="text-sm text-gray-500">{server.os}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Info */}
        <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
          <h2 className="text-xs uppercase text-gray-500 mb-3">Server Info</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="text-gray-300">{server.role}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">IPs</span><span className="text-gray-300 font-mono text-xs">{server.ips?.join(', ')}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">SSH</span><span className="text-gray-300 font-mono text-xs">{server.ssh_user}@{server.ssh_host}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tags</span><span className="text-gray-300">{server.tags?.join(', ')}</span></div>
          </div>
        </div>

        {/* Metrics */}
        {m && (
          <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
            <h2 className="text-xs uppercase text-gray-500 mb-3">Current Metrics</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">CPU</span>
                <p className="text-xl font-mono text-cyan-400">{Math.round(m.cpu)}%</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Memory</span>
                <p className="text-xl font-mono text-cyan-400">{m.memory_percent}%</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Load (1/5/15)</span>
                <p className="font-mono text-gray-300">{m.load_1?.toFixed(2)} / {m.load_5?.toFixed(2)} / {m.load_15?.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Uptime</span>
                <p className="font-mono text-gray-300 text-xs">{m.uptime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Disk */}
        <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
          <h2 className="text-xs uppercase text-gray-500 mb-3">Disk Usage</h2>
          <div className="space-y-2">
            {disks.map((d: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400 font-mono">{d.mount}</span>
                  <span className="text-gray-500">{d.used} / {d.size}</span>
                </div>
                <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.percent >= 90 ? 'bg-red-500' : d.percent >= 75 ? 'bg-amber-500' : 'bg-cyan-500'}`} style={{ width: `${d.percent}%` }} />
                </div>
              </div>
            ))}
            {disks.length === 0 && <p className="text-gray-600 text-xs">No disk data</p>}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg overflow-hidden">
        <div className="p-3 border-b border-[#1e1e3a]">
          <h2 className="text-xs uppercase text-gray-500">Services ({services.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-[#1e1e3a]">
              <th className="p-3">Status</th>
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">CPU</th>
              <th className="p-3">Memory</th>
              <th className="p-3">Port</th>
              <th className="p-3">Restarts</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(svc => (
              <tr key={svc.id} className="border-b border-[#1e1e3a] hover:bg-white/[0.02]">
                <td className="p-3">
                  <span className={`inline-block w-2 h-2 rounded-full ${svc.status === 'online' || svc.status === 'running' ? 'bg-green-500' : svc.status === 'stopped' ? 'bg-red-500' : 'bg-gray-500'}`} />
                </td>
                <td className="p-3 font-mono text-xs">{svc.name}</td>
                <td className="p-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e3a] text-gray-400">{svc.type}</span></td>
                <td className="p-3 font-mono text-xs">{svc.cpu?.toFixed(1)}%</td>
                <td className="p-3 font-mono text-xs">{svc.memory} MB</td>
                <td className="p-3 font-mono text-xs text-gray-500">{svc.port || '-'}</td>
                <td className="p-3 font-mono text-xs">{svc.restarts}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {['restart', 'stop', 'start'].map(action => (
                      <button key={action} onClick={() => handleServiceAction(svc, action)}
                        disabled={actionLoading === `${svc.id}:${action}`}
                        className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e3a] text-gray-400 hover:text-white hover:bg-cyan-500/20 transition-colors disabled:opacity-50">
                        {action}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {services.length === 0 && <p className="text-gray-600 text-xs p-4 text-center">No services discovered yet</p>}
      </div>
    </div>
  );
}
