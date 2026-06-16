import { useState } from 'react';

interface WorkflowStage {
  stage: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  agent: string;
}

interface WorkflowResponse {
  workflow_id: string;
  run_id: string;
  status: string;
  stages: WorkflowStage[];
}

export function useWorkflow() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastWorkflow, setLastWorkflow] = useState<WorkflowResponse | null>(null);

  const triggerWorkflow = async (request: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/workflows/product_release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to trigger workflow: ${text}`);
      }

      const data: WorkflowResponse = await response.json();
      setLastWorkflow(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { triggerWorkflow, loading, error, lastWorkflow };
}
