import { Bot } from 'lucide-react';

export function Login() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-indigo-400">
          <Bot className="h-8 w-8" />
          Agent OS
        </div>
        <p className="text-slate-400">Sign in to manage your AI agent fleet.</p>
        <div className="card space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          />
          <button className="btn-primary w-full">Sign in</button>
          <p className="text-xs text-slate-500">
            Clerk/LogTo integration required for production auth.
          </p>
        </div>
      </div>
    </div>
  );
}
