import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';
import { exportCsv } from '@/lib/csv';

interface RentRollRow {
  lease_id: string;
  property_id: string;
  property_name: string;
  unit_id: string;
  unit_label: string;
  tenant_id: string;
  tenant_name: string;
  monthly_rent: string;
  start_date: string;
  end_date: string;
  outstanding_balance: string;
  unapplied_credit: string;
}

interface PropertyOption {
  id: string;
  name: string;
}

export function ReportRentRollPage() {
  const [propertyId, setPropertyId] = useState('all');

  const properties = useQuery({
    queryKey: ['rentroll-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (data ?? []) as PropertyOption[];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['rentroll', propertyId],
    queryFn: async () => {
      let q = supabase.from('v_rent_roll').select('*').order('property_name');
      if (propertyId !== 'all') q = q.eq('property_id', propertyId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as RentRollRow[];
    },
  });

  function onExport() {
    exportCsv(
      'rent_roll.csv',
      (data ?? []).map((r) => ({
        property: r.property_name,
        unit: r.unit_label,
        tenant: r.tenant_name,
        start: r.start_date,
        end: r.end_date,
        monthly_rent: Number(r.monthly_rent).toFixed(2),
        outstanding_balance: Number(r.outstanding_balance).toFixed(2),
        unapplied_credit: Number(r.unapplied_credit).toFixed(2),
      })),
    );
  }

  return (
    <div>
      <PageHeader
        title="Rent roll"
        subtitle="Every active lease with property, unit, tenant, rent, balance"
        actions={
          <button type="button" className="btn-secondary" onClick={onExport}>
            Export CSV
          </button>
        }
      />
      <div className="mb-3">
        <label className="label">Filter by property</label>
        <select
          className="input max-w-md"
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
        >
          <option value="all">All properties</option>
          {(properties.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No active leases" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Property · Unit</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Outstanding</th>
                <th className="px-4 py-3 font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((r) => (
                <tr key={r.lease_id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">
                    <Link to={`/leases/${r.lease_id}`} className="text-fg-1 hover:underline">
                      {r.property_name} · {r.unit_label}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.tenant_name}</td>
                  <td className="px-4 py-3">
                    {fmtDate(r.start_date)} – {fmtDate(r.end_date)}
                  </td>
                  <td className="px-4 py-3">{fmtPHP(r.monthly_rent)}</td>
                  <td className="px-4 py-3">{fmtPHP(r.outstanding_balance)}</td>
                  <td className="px-4 py-3">{fmtPHP(r.unapplied_credit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
