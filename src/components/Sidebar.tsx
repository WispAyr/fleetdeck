'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/servers', label: 'Servers', icon: '⊟' },
  { href: '/services', label: 'Services', icon: '⚙' },
  { href: '/network', label: 'Network', icon: '⊕' },
  { href: '/alerts', label: 'Alerts', icon: '⚠' },
  { href: '/terminal', label: 'Terminal', icon: '▸' },
  { href: '/deployments', label: 'Deploys', icon: '↑' },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-52 bg-[#0d0d1a] border-r border-[#1e1e3a] flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-4 border-b border-[#1e1e3a]">
        <h1 className="text-lg font-bold text-cyan-400 font-mono tracking-wider">FLEETDECK</h1>
        <p className="text-[10px] text-gray-500 mt-0.5">Infrastructure Control</p>
      </div>
      <nav className="flex-1 py-2">
        {nav.map(n => {
          const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${active ? 'bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
              <span className="text-base w-5 text-center">{n.icon}</span>
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-[#1e1e3a] text-[10px] text-gray-600">
        FleetDeck v1.0
      </div>
    </aside>
  );
}
