'use client';
import { useEffect, useState, useRef } from 'react';

export default function TerminalPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [output, setOutput] = useState('');
  const [command, setCommand] = useState('');
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/servers').then(r => r.json()).then(data => {
      setServers(data);
      if (data.length > 0) setSelected(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCommand = async () => {
    if (!command.trim() || !selected || running) return;
    setRunning(true);
    setOutput(prev => prev + `\n$ ${command}\n`);
    try {
      const res = await fetch(`/api/terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId: selected, command }),
      });
      const data = await res.json();
      setOutput(prev => prev + (data.output || data.error || '') + '\n');
    } catch (err: any) {
      setOutput(prev => prev + `Error: ${err.message}\n`);
    }
    setCommand('');
    setRunning(false);
  };

  const serverName = servers.find(s => s.id === selected)?.name || '';

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Terminal</h1>
        <select value={selected} onChange={e => { setSelected(e.target.value); setOutput(''); }}
          className="bg-[#12122a] border border-[#1e1e3a] rounded px-3 py-1.5 text-sm text-gray-300 focus:border-cyan-500 outline-none">
          {servers.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div ref={outputRef} className="flex-1 bg-[#0a0a12] border border-[#1e1e3a] rounded-lg p-4 font-mono text-xs text-green-400 overflow-auto whitespace-pre-wrap mb-3">
        <span className="text-gray-600"># Connected to {serverName}</span>
        {output}
      </div>

      <div className="flex gap-2">
        <span className="text-cyan-400 font-mono text-sm self-center">$</span>
        <input type="text" value={command} onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runCommand()}
          placeholder="Enter command..."
          className="flex-1 bg-[#12122a] border border-[#1e1e3a] rounded px-3 py-2 font-mono text-sm text-gray-200 focus:border-cyan-500 outline-none"
          autoFocus />
        <button onClick={runCommand} disabled={running}
          className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 disabled:opacity-50">
          Run
        </button>
      </div>
    </div>
  );
}
