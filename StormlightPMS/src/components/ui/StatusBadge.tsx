import { cn } from '@/lib/cn';

const SUCCESS = 'bg-success-bg text-success-fg';
const WARNING = 'bg-warning-bg text-warning-fg';
const DANGER = 'bg-danger-bg text-danger-fg';
const INFO = 'bg-info-bg text-info-fg';
const NEUTRAL = 'bg-muted text-fg-2';

const palette: Record<string, string> = {
  active: SUCCESS,
  draft: NEUTRAL,
  expired: NEUTRAL,
  terminated: WARNING,
  renewed: INFO,
  vacant: NEUTRAL,
  occupied: SUCCESS,
  under_maintenance: WARNING,
  unavailable: NEUTRAL,
  unpaid: DANGER,
  partially_paid: WARNING,
  paid: SUCCESS,
  void: NEUTRAL,
  suspended: DANGER,
  inactive: NEUTRAL,
  archived: NEUTRAL,
  open: DANGER,
  in_progress: WARNING,
  completed: SUCCESS,
  cancelled: NEUTRAL,
  low: NEUTRAL,
  medium: INFO,
  high: WARNING,
  urgent: DANGER,
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-fg-3">—</span>;
  const cls = palette[value] ?? NEUTRAL;
  return <span className={cn('badge', cls)}>{value.replace(/_/g, ' ')}</span>;
}
