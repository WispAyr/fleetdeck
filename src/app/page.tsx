'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ServerCard from '@/components/ServerCard';

export default function Dashboard() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    try {
      // Trigger collector
      await fetch('/api/collector');
      const res = await fetch('/api/servers');
      const data = await res.json();
      setServers(data);
    } catch (err) {
      console.error('Failed to fetch servers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const online = servers.filter(s => s.status === 'online').length;
  const offline = servers.filter(s => s.status !== 'online').length;
  const totalServices = servers.reduce((a, s) => a + (s.service_count || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Fleet Overview</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time infrastructure health</p>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-400">{online} online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-400">{offline} offline</span>
          </div>
          <div className="text-gray-500">|</div>
          <span className="text-gray-400">{totalServices} services</span>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-20">Loading fleet data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {servers.map(server => (
            <ServerCard key={server.id} server={server} onClick={() => router.push(`/servers/${server.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
