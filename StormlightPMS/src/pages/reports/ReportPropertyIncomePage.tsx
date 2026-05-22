import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtPHP, manilaToday } from '@/lib/format';
import { exportCsv } from '@/lib/csv';

interface Row {
  property_id: string;
  property_name: string;
  total_received: string;
}

export function ReportPropertyIncomePage() {
  const today = manilaToday();
  const [from, setFrom] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(today);

  const { data, isLoading } = useQuery({
    queryKey: ['property-income', from, to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpt_property_income', {
        p_from: from,
        p_to: to,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  function onExport() {
    exportCsv(
      `property_income_${from}_${to}.csv`,
      (data ?? []).map((r) => ({
        property: r.property_name,
        total_received: Number(r.total_received).toFixed(2),
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Per-property income"
        actions={
          <button type="button" className="btn-secondary" onClick={onExport}>
            Export CSV
          </button>
        }
      />
      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No payments in this range" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Total received</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((r) => (
                <tr key={r.property_id} className="table-row border-t border-slate-100">
                  <td className="px-4 py-3">{r.property_name}</td>
                  <td className="px-4 py-3">{fmtPHP(r.total_received)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
