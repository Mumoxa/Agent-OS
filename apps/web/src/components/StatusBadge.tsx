type Status = 'running' | 'idle' | 'sleeping' | 'failed';

const colors: Record<Status, string> = {
  running: 'bg-emerald-500/10 text-emerald-400',
  idle: 'bg-blue-500/10 text-blue-400',
  sleeping: 'bg-amber-500/10 text-amber-400',
  failed: 'bg-rose-500/10 text-rose-400',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge ${colors[status] ?? colors.idle}`}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
