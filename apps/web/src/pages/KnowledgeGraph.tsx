import { Search, Network } from 'lucide-react';
import { useState } from 'react';

const entities = [
  { id: 'ent_1', type: 'Feature', name: 'SSO Login', status: 'proposed' },
  { id: 'ent_2', type: 'Customer', name: 'Acme Corp', status: 'active' },
  { id: 'ent_3', type: 'Decision', name: 'Prioritize SSO Login', status: 'approved' },
];

export function KnowledgeGraph() {
  const [query, setQuery] = useState('');

  const filtered = entities.filter((e) => e.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Knowledge Graph</h1>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Search entities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((entity) => (
          <div key={entity.id} className="card">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-medium text-slate-500">{entity.type}</span>
            </div>
            <h3 className="mt-2 font-medium text-slate-100">{entity.name}</h3>
            <p className="text-xs text-slate-400">Status: {entity.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
