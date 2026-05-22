import { cn } from '@/lib/cn';

const palette: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  draft: 'bg-slate-100 text-slate-700',
  expired: 'bg-slate-200 text-slate-700',
  terminated: 'bg-amber-100 text-amber-800',
  renewed: 'bg-blue-100 text-blue-800',
  vacant: 'bg-slate-100 text-slate-700',
  occupied: 'bg-emerald-100 text-emerald-800',
  under_maintenance: 'bg-amber-100 text-amber-800',
  unavailable: 'bg-slate-200 text-slate-700',
  unpaid: 'bg-rose-100 text-rose-800',
  partially_paid: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  void: 'bg-slate-200 text-slate-600',
  suspended: 'bg-rose-100 text-rose-800',
  inactive: 'bg-slate-200 text-slate-600',
  archived: 'bg-slate-200 text-slate-600',
  open: 'bg-rose-100 text-rose-800',
  in_progress: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-600',
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-amber-100 text-amber-800',
  urgent: 'bg-rose-100 text-rose-800',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const cls = palette[value] ?? 'bg-slate-100 text-slate-700';
  return <span className={cn('badge', cls)}>{value.replace(/_/g, ' ')}</span>;
}
