import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout.js';
import { Dashboard } from './pages/Dashboard.js';
import { AgentDetail } from './pages/AgentDetail.js';
import { Approvals } from './pages/Approvals.js';
import { KnowledgeGraph } from './pages/KnowledgeGraph.js';
import { Login } from './pages/Login.js';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="agents/:agentId" element={<AgentDetail />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="knowledge" element={<KnowledgeGraph />} />
      </Route>
    </Routes>
  );
}

export default App;
