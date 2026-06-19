import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';

interface LeaseRow {
  id: string;
  lease_status: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  units: { unit_label: string; properties: { name: string } | null } | null;
  tenants: { full_name: string } | null;
}

export function LeasesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const { data, isLoading } = useQuery({
    queryKey: ['leases', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('leases')
        .select(
          'id, lease_status, start_date, end_date, monthly_rent, units(unit_label, properties(name)), tenants(full_name)',
        )
        .order('start_date', { ascending: false })
        .limit(200);
      if (statusFilter !== 'all') q = q.eq('lease_status', statusFilter);
      const { data: rows, error } = await q;
      if (error) throw error;
      return (rows ?? []) as unknown as LeaseRow[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Leases"
        actions={
          <Link to="/leases/new" className="btn-primary">
            New lease
          </Link>
        }
      />
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-fg-2">Status</label>
        <select
          className="input max-w-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
          <option value="renewed">Renewed</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No leases" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Property · Unit</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Rent</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((l) => (
                <tr key={l.id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">
                    <Link to={`/leases/${l.id}`} className="text-fg-1 hover:underline">
                      {l.units?.properties?.name ?? '—'} · {l.units?.unit_label ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{l.tenants?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">
                    {fmtDate(l.start_date)} – {fmtDate(l.end_date)}
                  </td>
                  <td className="px-4 py-3">{fmtPHP(l.monthly_rent)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={l.lease_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
