import { Link } from 'react-router-dom';
import { StatusBadge } from './StatusBadge.js';
import { Bot } from 'lucide-react';

interface AgentCardProps {
  agent: {
    agent_id: string;
    name: string;
    status: 'running' | 'idle' | 'sleeping' | 'failed';
    purpose: string;
    last_run_at?: string;
  };
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link to={`/agents/${agent.agent_id}`} className="card hover:border-indigo-500/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2">
            <Bot className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-medium text-slate-100">{agent.name}</h3>
            <p className="text-xs text-slate-400">{agent.agent_id}</p>
          </div>
        </div>
        <StatusBadge status={agent.status} />
      </div>
      <p className="mt-3 text-sm text-slate-400 line-clamp-2">{agent.purpose}</p>
      {agent.last_run_at && (
        <p className="mt-2 text-xs text-slate-500">Last run: {new Date(agent.last_run_at).toLocaleString()}</p>
      )}
    </Link>
  );
}
