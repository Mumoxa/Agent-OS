import { useParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge.js';
import { Activity, Moon, Play, Settings } from 'lucide-react';

export function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();

  const agent = {
    agent_id: agentId,
    name: 'Founder Chief of Staff',
    status: 'running' as const,
    purpose: 'Executive proxy for the founder.',
    permissions: ['read:all', 'write:strategic'],
    memory_access: ['strategic', 'operational:read'],
    sleep_schedule: { deep_sleep_start: '23:00', deep_sleep_end: '06:00', wake_interval_minutes: 15 },
  };

  const events = [
    { id: 'evt_1', type: 'agent.run.completed', timestamp: '2026-06-16T07:00:00Z', summary: 'Daily briefing generated' },
    { id: 'evt_2', type: 'agent.output.generated', timestamp: '2026-06-16T07:15:00Z', summary: 'Priority list updated' },
  ];

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs text-slate-500">{agent.agent_id}</p>
            <h1 className="text-2xl font-bold text-slate-100">{agent.name}</h1>
            <p className="mt-1 text-sm text-slate-400">{agent.purpose}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={agent.status} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button className="btn-primary">
            <Play className="mr-2 h-4 w-4" /> Run now
          </button>
          <button className="btn-secondary">
            <Moon className="mr-2 h-4 w-4" /> Sleep
          </button>
          <button className="btn-secondary">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Activity className="h-5 w-5 text-indigo-400" /> Activity
          </h2>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-lg bg-slate-800/50 p-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                <div>
                  <p className="text-sm font-medium text-slate-100">{event.type}</p>
                  <p className="text-sm text-slate-400">{event.summary}</p>
                  <p className="mt-1 text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-100">Sleep Schedule</h3>
            <p className="mt-1 text-sm text-slate-400">
              Deep sleep: {agent.sleep_schedule.deep_sleep_start} – {agent.sleep_schedule.deep_sleep_end}
            </p>
            <p className="text-sm text-slate-400">Wake interval: {agent.sleep_schedule.wake_interval_minutes} min</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-100">Permissions</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.permissions.map((p) => (
                <span key={p} className="badge bg-slate-800 text-slate-300">
                  {p}
                </span>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="font-semibold text-slate-100">Memory Access</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {agent.memory_access.map((m) => (
                <span key={m} className="badge bg-slate-800 text-slate-300">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
