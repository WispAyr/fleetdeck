'use client';
import { useEffect, useState } from 'react';

export default function ServicesPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/servers').then(r => r.json()).then(async (data) => {
      setServers(data);
      const svcs: any[] = [];
      for (const s of data) {
        const res = await fetch(`/api/servers/${s.id}/services`);
        const services = await res.json();
        services.forEach((svc: any) => { svc.server_name = s.name; });
        svcs.push(...services);
      }
      setAllServices(svcs);
    });
  }, []);

  const filtered = filter === 'all' ? allServices : allServices.filter(s => s.type === filter);
  const types = [...new Set(allServices.map(s => s.type))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">All Services</h1>
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`text-xs px-3 py-1 rounded ${filter === 'all' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1e1e3a] text-gray-400'}`}>All ({allServices.length})</button>
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`text-xs px-3 py-1 rounded ${filter === t ? 'bg-cyan-500/20 text-cyan-400' : 'bg-[#1e1e3a] text-gray-400'}`}>
              {t} ({allServices.filter(s => s.type === t).length})
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-[#1e1e3a]">
              <th className="p-3">Status</th>
              <th className="p-3">Service</th>
              <th className="p-3">Server</th>
              <th className="p-3">Type</th>
              <th className="p-3">CPU</th>
              <th className="p-3">Memory</th>
              <th className="p-3">Port</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(svc => (
              <tr key={svc.id} className="border-b border-[#1e1e3a] hover:bg-white/[0.02]">
                <td className="p-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${svc.status === 'online' || svc.status === 'running' ? 'bg-green-500' : 'bg-gray-500'}`} />
                </td>
                <td className="p-3 font-mono text-xs">{svc.name}</td>
                <td className="p-3 text-gray-400 text-xs">{svc.server_name}</td>
                <td className="p-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e1e3a] text-gray-400">{svc.type}</span></td>
                <td className="p-3 font-mono text-xs">{svc.cpu?.toFixed(1)}%</td>
                <td className="p-3 font-mono text-xs">{svc.memory} MB</td>
                <td className="p-3 font-mono text-xs text-gray-500">{svc.port || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
