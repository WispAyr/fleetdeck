'use client';
import { useEffect, useState } from 'react';

export default function NetworkPage() {
  const [servers, setServers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/servers').then(r => r.json()).then(setServers);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Network Overview</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Topology */}
        <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
          <h2 className="text-xs uppercase text-gray-500 mb-4">Fleet Topology</h2>
          <div className="space-y-3">
            {servers.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2 bg-[#0d0d1a] rounded">
                <div className={`w-2.5 h-2.5 rounded-full ${s.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-300">{s.name}</div>
                  <div className="text-[10px] font-mono text-gray-500">{s.ips?.join(' | ')}</div>
                </div>
                <span className="text-[10px] text-gray-600">{s.os}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Network Info */}
        <div className="space-y-4">
          <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
            <h2 className="text-xs uppercase text-gray-500 mb-3">Networks</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 p-2 bg-[#0d0d1a] rounded">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <span className="text-gray-300">ZeroTier</span>
                <span className="font-mono text-xs text-gray-500 ml-auto">192.168.195.0/24</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#0d0d1a] rounded">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-300">LAN</span>
                <span className="font-mono text-xs text-gray-500 ml-auto">10.10.10.0/24</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-[#0d0d1a] rounded">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-gray-300">WireGuard</span>
                <span className="font-mono text-xs text-gray-500 ml-auto">10.42.42.0/24</span>
              </div>
            </div>
          </div>

          <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg p-4">
            <h2 className="text-xs uppercase text-gray-500 mb-3">Quick Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0d0d1a] rounded text-center">
                <div className="text-2xl font-mono text-cyan-400">{servers.length}</div>
                <div className="text-[10px] text-gray-500">Total Servers</div>
              </div>
              <div className="p-3 bg-[#0d0d1a] rounded text-center">
                <div className="text-2xl font-mono text-green-400">{servers.filter(s => s.status === 'online').length}</div>
                <div className="text-[10px] text-gray-500">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
