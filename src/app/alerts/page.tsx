'use client';
import { useEffect, useState } from 'react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/alerts').then(r => r.json()).then(setAlerts);
  }, []);

  const acknowledge = async (id: number) => {
    await fetch('/api/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, acknowledged: true }),
    });
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: 1 } : a));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>
      <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg overflow-hidden">
        {alerts.length === 0 ? (
          <p className="text-gray-600 text-sm p-8 text-center">No alerts — all clear ✓</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-[#1e1e3a]">
                <th className="p-3">Severity</th>
                <th className="p-3">Server</th>
                <th className="p-3">Type</th>
                <th className="p-3">Message</th>
                <th className="p-3">Time</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a.id} className={`border-b border-[#1e1e3a] ${a.acknowledged ? 'opacity-40' : ''}`}>
                  <td className="p-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded ${a.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="p-3 text-gray-300">{a.server_name}</td>
                  <td className="p-3 text-gray-500">{a.type}</td>
                  <td className="p-3 text-gray-300 text-xs">{a.message}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="p-3">
                    {!a.acknowledged && (
                      <button onClick={() => acknowledge(a.id)} className="text-[10px] px-2 py-0.5 rounded bg-[#1e1e3a] text-gray-400 hover:text-white">
                        Ack
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
