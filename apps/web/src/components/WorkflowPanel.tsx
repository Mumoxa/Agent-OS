import { useEffect, useState } from 'react';
import { useWorkflow } from '../hooks/useWorkflow.js';
import { Rocket, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

const stageNames: Record<string, string> = {
  'product.prd': 'Product PRD',
  'code.pr': 'Engineering PR',
  'qa.review': 'QA Review',
  'deploy.staging': 'Staging Deploy',
};

interface WorkflowPanelProps {
  lastEvent?: any;
}

export function WorkflowPanel({ lastEvent }: WorkflowPanelProps) {
  const [request, setRequest] = useState('Build a feature that exports daily briefings as PDF');
  const { triggerWorkflow, loading, error, lastWorkflow } = useWorkflow();
  const [stageStatus, setStageStatus] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});

  useEffect(() => {
    setStageStatus({});
  }, [lastWorkflow?.workflow_id]);

  useEffect(() => {
    if (!lastEvent || !lastWorkflow) return;
    const payload = lastEvent.payload ?? lastEvent;
    if (payload.workflow_id !== lastWorkflow.workflow_id) return;

    const topicToStage: Record<string, string> = {
      'product.prd': 'product.prd',
      'code.pr': 'code.pr',
      'qa.review': 'qa.review',
      'deploy.staging': 'deploy.staging',
    };

    const stage = topicToStage[lastEvent.event_type];
    if (!stage) return;

    setStageStatus((prev) => ({ ...prev, [stage]: 'completed' }));
  }, [lastEvent, lastWorkflow]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await triggerWorkflow(request);
  };

  return (
    <div className="card">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
        <Rocket className="h-5 w-5 text-indigo-400" />
        Product Release Pipeline
      </h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          placeholder="Describe the feature you want to build..."
        />
        <button
          type="submit"
          disabled={loading || !request.trim()}
          className="btn-primary w-full disabled:opacity-50"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
          {loading ? 'Starting pipeline...' : 'Start pipeline'}
        </button>
      </form>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {lastWorkflow && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-500">
            Workflow ID: <span className="font-mono text-slate-400">{lastWorkflow.workflow_id}</span>
          </p>
          <div className="space-y-2">
            {lastWorkflow.stages.map((stage) => {
              const status = stageStatus[stage.stage] ?? stage.status;
              return (
                <div
                  key={stage.stage}
                  className="flex items-center justify-between rounded-lg bg-slate-800/50 px-3 py-2"
                >
                  <span className="text-sm text-slate-300">{stageNames[stage.stage] ?? stage.stage}</span>
                  <span className="flex items-center gap-1.5 text-xs">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : status === 'running' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-500" />
                    )}
                    <span className={
                      status === 'completed'
                        ? 'text-emerald-400'
                        : status === 'running'
                        ? 'text-indigo-400'
                        : 'text-slate-500'
                    }>
                      {status}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
