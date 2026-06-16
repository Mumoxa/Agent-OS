import { Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';

const approvals = [
  {
    approval_id: 'apr_001',
    title: 'Deploy feature branch to staging',
    description: 'Merge PR #42 and deploy canary to staging environment.',
    agent: 'DevOps Agent',
    risk_level: 'medium',
    estimated_cost_usd: 0,
    requested_at: '2026-06-16T08:30:00Z',
  },
  {
    approval_id: 'apr_002',
    title: 'Purchase $200/month research data source',
    description: 'Research Agent requests access to a paid paper database.',
    agent: 'Research Agent',
    risk_level: 'high',
    estimated_cost_usd: 200,
    requested_at: '2026-06-16T08:45:00Z',
  },
];

const riskColors: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-400',
  high: 'bg-rose-500/10 text-rose-400',
};

export function Approvals() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Approval Inbox</h1>

      <div className="space-y-4">
        {approvals.map((approval) => (
          <div key={approval.approval_id} className="card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-100">{approval.title}</h3>
                  <span className={`badge ${riskColors[approval.risk_level]}`}>{approval.risk_level}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{approval.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="rounded bg-slate-800 px-2 py-1">{approval.agent}</span>
                  <span className="rounded bg-slate-800 px-2 py-1">
                    Cost: ${approval.estimated_cost_usd.toFixed(2)}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-1">
                    {new Date(approval.requested_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-primary">
                  <Check className="mr-2 h-4 w-4" /> Approve
                </button>
                <button className="btn-danger">
                  <X className="mr-2 h-4 w-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 text-indigo-400" />
          <div>
            <p className="font-medium text-slate-100">Approval policy</p>
            <p className="text-sm text-slate-400">
              High-risk actions and any spend require explicit human approval. Medium-risk actions may be auto-approved based on policy rules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
