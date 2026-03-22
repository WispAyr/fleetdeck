'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/servers').then(r => r.json()).then(setServers);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Server Registry</h1>
      <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase border-b border-[#1e1e3a]">
              <th className="p-3">Status</th>
              <th className="p-3">Name</th>
              <th className="p-3">IPs</th>
              <th className="p-3">OS</th>
              <th className="p-3">Role</th>
              <th className="p-3">Services</th>
            </tr>
          </thead>
          <tbody>
            {servers.map(s => (
              <tr key={s.id} className="border-b border-[#1e1e3a] hover:bg-white/[0.02]">
                <td className="p-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                </td>
                <td className="p-3">
                  <Link href={`/servers/${s.id}`} className="text-cyan-400 hover:underline font-medium">{s.name}</Link>
                </td>
                <td className="p-3 font-mono text-xs text-gray-400">{s.ips?.join(', ')}</td>
                <td className="p-3 text-gray-400">{s.os}</td>
                <td className="p-3 text-gray-500 text-xs">{s.role}</td>
                <td className="p-3 font-mono">{s.service_count || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
