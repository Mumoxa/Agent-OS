import { Outlet, NavLink } from 'react-router-dom';
import { Home, Bot, CheckSquare, Network, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/approvals', icon: CheckSquare, label: 'Approvals' },
    { to: '/knowledge', icon: Network, label: 'Knowledge' },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 p-4 md:hidden">
        <div className="flex items-center gap-2 font-semibold text-indigo-400">
          <Bot className="h-6 w-6" />
          Agent OS
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-300">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          menuOpen ? 'block' : 'hidden'
        } w-full border-r border-slate-800 bg-slate-900 p-4 md:block md:w-64`}
      >
        <div className="mb-6 hidden items-center gap-2 font-semibold text-indigo-400 md:flex">
          <Bot className="h-6 w-6" />
          Agent OS
        </div>
        <nav className="space-y-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
