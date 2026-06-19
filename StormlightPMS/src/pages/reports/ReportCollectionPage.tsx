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
  total_charged: string;
  total_collected: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

export function ReportCollectionPage() {
  const today = manilaToday();
  const [from, setFrom] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(today);
  const [propertyId, setPropertyId] = useState('all');

  const properties = useQuery({
    queryKey: ['col-properties'],
    queryFn: async () => {
      const { data, error } = await supabase.from('properties').select('id, name').order('name');
      if (error) throw error;
      return (data ?? []) as PropertyOption[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['collection', from, to, propertyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpt_collection_summary', {
        p_from: from,
        p_to: to,
        p_property_id: propertyId === 'all' ? null : propertyId,
      });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  function onExport() {
    exportCsv(
      `collection_${from}_${to}.csv`,
      (data ?? []).map((r) => ({
        property: r.property_name,
        total_charged: Number(r.total_charged).toFixed(2),
        total_collected: Number(r.total_collected).toFixed(2),
        delta: (Number(r.total_collected) - Number(r.total_charged)).toFixed(2),
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Collection summary"
        subtitle="Charged vs collected for a date range"
        actions={
          <button type="button" className="btn-secondary" onClick={onExport}>
            Export CSV
          </button>
        }
      />
      <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">Property</label>
          <select
            className="input"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="all">All</option>
            {(properties.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No data in this range" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Charged</th>
                <th className="px-4 py-3 font-medium">Collected</th>
                <th className="px-4 py-3 font-medium">Delta</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((r) => {
                const delta = Number(r.total_collected) - Number(r.total_charged);
                return (
                  <tr key={r.property_id} className="table-row border-t border-subtle">
                    <td className="px-4 py-3">{r.property_name}</td>
                    <td className="px-4 py-3">{fmtPHP(r.total_charged)}</td>
                    <td className="px-4 py-3">{fmtPHP(r.total_collected)}</td>
                    <td className={`px-4 py-3 ${delta < 0 ? 'text-danger-700' : 'text-success-700'}`}>
                      {fmtPHP(delta)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
