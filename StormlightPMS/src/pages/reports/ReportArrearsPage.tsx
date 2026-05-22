import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtPHP } from '@/lib/format';
import { exportCsv } from '@/lib/csv';

interface Bucket {
  bucket: string;
  outstanding: string;
}

export function ReportArrearsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['arrears'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpt_arrears_aging');
      if (error) throw error;
      return (data ?? []) as Bucket[];
    },
  });

  function onExport() {
    exportCsv(
      'arrears_aging.csv',
      (data ?? []).map((b) => ({
        bucket: b.bucket,
        outstanding: Number(b.outstanding).toFixed(2),
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Arrears aging"
        subtitle="Outstanding balances bucketed by days past due (Manila today)"
        actions={
          <button type="button" className="btn-secondary" onClick={onExport}>
            Export CSV
          </button>
        }
      />
      {error && <div className="text-sm text-red-700 mb-3">{(error as Error).message}</div>}
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No outstanding charges" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Bucket</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((b) => (
                <tr key={b.bucket} className="table-row border-t border-slate-100">
                  <td className="px-4 py-3">{b.bucket}</td>
                  <td className="px-4 py-3">{fmtPHP(b.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
