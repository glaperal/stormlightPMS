import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { fmtPHP } from '@/lib/format';

interface DashboardRow {
  occupied_units: number;
  vacant_units: number;
  total_outstanding: number;
  charges_due_next_7: number;
}

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardRow> => {
      const { data: row, error: err } = await supabase
        .rpc('rpt_dashboard')
        .maybeSingle();
      if (err) throw err;
      return (row as unknown as DashboardRow) ?? {
        occupied_units: 0,
        vacant_units: 0,
        total_outstanding: 0,
        charges_due_next_7: 0,
      };
    },
  });

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Occupancy, arrears, and upcoming charges" />
      {error && <div className="text-sm text-danger-700">{(error as Error).message}</div>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card label="Occupied units" value={isLoading ? '…' : String(data?.occupied_units ?? 0)} />
        <Card label="Vacant units" value={isLoading ? '…' : String(data?.vacant_units ?? 0)} />
        <Card label="Total outstanding" value={isLoading ? '…' : fmtPHP(data?.total_outstanding ?? 0)} />
        <Card label="Charges due (next 7 days)" value={isLoading ? '…' : fmtPHP(data?.charges_due_next_7 ?? 0)} />
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-fg-3">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-fg-1">{value}</div>
    </div>
  );
}
