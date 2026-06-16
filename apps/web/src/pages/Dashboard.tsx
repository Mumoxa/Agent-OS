import { AgentCard } from '../components/AgentCard.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { WorkflowPanel } from '../components/WorkflowPanel.js';
import { useSSE } from '../hooks/useSSE.js';
import { Bell, AlertTriangle, Radio } from 'lucide-react';

const agents = [
  {
    agent_id: 'founder_chief_of_staff',
    name: 'Founder Chief of Staff',
    status: 'running' as const,
    purpose: 'Executive proxy, daily briefings, and cross-agent prioritization.',
    last_run_at: '2026-06-16T07:00:00Z',
  },
  {
    agent_id: 'product_manager',
    name: 'Product Manager',
    status: 'idle' as const,
    purpose: 'Backlog, PRDs, roadmap, and feature lifecycle.',
  },
  {
    agent_id: 'engineering',
    name: 'Engineering',
    status: 'sleeping' as const,
    purpose: 'Code generation, review, and implementation.',
  },
  {
    agent_id: 'qa',
    name: 'QA',
    status: 'idle' as const,
    purpose: 'Test generation, PR review, and release gating.',
  },
  {
    agent_id: 'devops',
    name: 'DevOps',
    status: 'idle' as const,
    purpose: 'Deployment, infrastructure, monitoring, and cost.',
  },
  {
    agent_id: 'security_audit',
    name: 'Security / Audit',
    status: 'running' as const,
    purpose: 'Threat monitoring, policy enforcement, and audit logging.',
  },
];

const pendingApprovals = [
  {
    approval_id: 'apr_001',
    title: 'Deploy feature branch to staging',
    agent: 'DevOps Agent',
    risk_level: 'medium',
  },
];

const alerts = [
  { id: 'alrt_001', severity: 'high', message: 'Agent eng_01 exceeded tool timeout 3 times' },
];

export function Dashboard() {
  const { connected, lastEvent } = useSSE({
    url: '/api/v1/stream',
    topics: ['agent.lifecycle', 'agent.approval_request', 'security.alert', 'product.prd', 'code.pr', 'qa.review', 'deploy.staging'],
    onEvent: (topic, event) => {
      console.log(`SSE ${topic}:`, event);
      // TODO: refetch data when agent events arrive
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <div className="flex items-center gap-3">
          <span className={`badge ${connected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            <Radio className="h-3 w-3" />
            {connected ? 'Live' : 'Disconnected'}
          </span>
          <button className="btn-secondary">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </button>
        </div>
      </div>
      {lastEvent && (
        <div className="card text-sm text-slate-400">
          Last event: <span className="text-slate-100">{lastEvent.event_type ?? lastEvent.type}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm text-slate-400">Active Agents</p>
          <p className="text-3xl font-bold text-indigo-400">2</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Pending Approvals</p>
          <p className="text-3xl font-bold text-amber-400">{pendingApprovals.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">Security Alerts</p>
          <p className="text-3xl font-bold text-rose-400">{alerts.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-400">LLM Cost Today</p>
          <p className="text-3xl font-bold text-emerald-400">$0.00</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Agents</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agents.map((agent) => (
              <AgentCard key={agent.agent_id} agent={agent} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Pending Approvals</h2>
          <div className="card space-y-3">
            {pendingApprovals.length === 0 ? (
              <p className="text-sm text-slate-500">No pending approvals.</p>
            ) : (
              pendingApprovals.map((approval) => (
                <div key={approval.approval_id} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                  <p className="font-medium text-slate-100">{approval.title}</p>
                  <p className="text-xs text-slate-400">
                    {approval.agent} · Risk: {approval.risk_level}
                  </p>
                </div>
              ))
            )}
          </div>

          <h2 className="text-lg font-semibold text-slate-100">Security Alerts</h2>
          <div className="card space-y-3">
            {alerts.length === 0 ? (
              <p className="text-sm text-slate-500">No alerts.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <span className="text-slate-300">{alert.message}</span>
                </div>
              ))
            )}
          </div>

          <WorkflowPanel lastEvent={lastEvent} />
        </div>
      </div>
    </div>
  );
}
