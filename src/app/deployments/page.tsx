'use client';
import { useEffect, useState } from 'react';

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/deployments').then(r => r.json()).then(setDeployments).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Deployments</h1>
      <div className="bg-[#12122a] border border-[#1e1e3a] rounded-lg overflow-hidden">
        {deployments.length === 0 ? (
          <p className="text-gray-600 text-sm p-8 text-center">No deployments tracked yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 text-xs uppercase border-b border-[#1e1e3a]">
                <th className="p-3">Service</th>
                <th className="p-3">Server</th>
                <th className="p-3">Branch</th>
                <th className="p-3">Commit</th>
                <th className="p-3">Deployed</th>
                <th className="p-3">By</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map(d => (
                <tr key={d.id} className="border-b border-[#1e1e3a]">
                  <td className="p-3 font-mono text-xs text-cyan-400">{d.service_name}</td>
                  <td className="p-3 text-gray-400 text-xs">{d.server_name}</td>
                  <td className="p-3 font-mono text-xs">{d.branch}</td>
                  <td className="p-3 font-mono text-xs text-gray-500">{d.commit_hash?.slice(0, 7)}</td>
                  <td className="p-3 text-xs text-gray-500">{new Date(d.deployed_at).toLocaleString()}</td>
                  <td className="p-3 text-xs text-gray-500">{d.deployed_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
