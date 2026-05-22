import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtPHP, fmtDate } from '@/lib/format';
import { useAuth, hasRole } from '@/lib/auth';

interface UnitRow {
  id: string;
  org_id: string;
  unit_label: string;
  property_id: string;
  base_monthly_rent: string;
  unit_status: string;
  bedrooms: number | null;
  floor: string | null;
  floor_area_sqm: string | null;
  notes: string | null;
  properties: { name: string } | null;
}

interface LeaseRow {
  id: string;
  lease_status: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  tenants: { full_name: string } | null;
}

export function UnitDetailPage() {
  const { unitId } = useParams();
  const qc = useQueryClient();
  const { claims } = useAuth();

  const unit = useQuery({
    queryKey: ['unit', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*, properties(name)')
        .eq('id', unitId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as UnitRow | null;
    },
    enabled: !!unitId,
  });

  const leases = useQuery({
    queryKey: ['unit-leases', unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('id, lease_status, start_date, end_date, monthly_rent, tenants(full_name)')
        .eq('unit_id', unitId!)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeaseRow[];
    },
    enabled: !!unitId,
  });

  const setStatus = useMutation({
    mutationFn: async (next: 'under_maintenance' | 'unavailable' | 'vacant') => {
      const { error } = await supabase.from('units').update({ unit_status: next }).eq('id', unitId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['unit', unitId] }),
  });

  if (unit.isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!unit.data) return <EmptyState title="Unit not found" />;
  const u = unit.data;

  return (
    <div>
      <PageHeader
        title={`${u.properties?.name ?? 'Property'} · Unit ${u.unit_label}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={u.unit_status} />
            {hasRole(claims, 'admin', 'superadmin', 'property_manager') && (
              <>
                {u.unit_status !== 'under_maintenance' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setStatus.mutate('under_maintenance')}
                  >
                    Mark maintenance
                  </button>
                )}
                {u.unit_status !== 'unavailable' && u.unit_status !== 'occupied' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setStatus.mutate('unavailable')}
                  >
                    Mark unavailable
                  </button>
                )}
                {u.unit_status !== 'vacant' && u.unit_status !== 'occupied' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setStatus.mutate('vacant')}
                  >
                    Mark vacant
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      <section className="card p-5 mb-6">
        <dl className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-500">Base rent</dt>
            <dd className="mt-1">{fmtPHP(u.base_monthly_rent)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Floor</dt>
            <dd className="mt-1">{u.floor ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Bedrooms</dt>
            <dd className="mt-1">{u.bedrooms ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Area (sqm)</dt>
            <dd className="mt-1">{u.floor_area_sqm ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-base font-medium text-slate-900 mb-3">Lease history</h2>
        {(leases.data ?? []).length === 0 ? (
          <EmptyState title="No leases on this unit" />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Term</th>
                  <th className="px-4 py-3 font-medium">Rent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {leases.data!.map((l) => (
                  <tr key={l.id} className="table-row border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link to={`/leases/${l.id}`} className="text-slate-900 hover:underline">
                        {l.tenants?.full_name ?? '—'}
                      </Link>
                    </td>
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
      </section>
    </div>
  );
}
