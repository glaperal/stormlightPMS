import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';

interface Tenant {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  gov_id_type: string | null;
  gov_id_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: 'active' | 'archived';
}

interface LeaseRow {
  id: string;
  lease_status: string;
  start_date: string;
  end_date: string;
  monthly_rent: string;
  units: { unit_label: string; properties: { name: string } | null } | null;
}

export function TenantDetailPage() {
  const { tenantId } = useParams();
  const qc = useQueryClient();

  const tenant = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Tenant | null;
    },
    enabled: !!tenantId,
  });

  const leases = useQuery({
    queryKey: ['tenant-leases', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(
          'id, lease_status, start_date, end_date, monthly_rent, units(unit_label, properties(name))',
        )
        .eq('tenant_id', tenantId!)
        .order('start_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as LeaseRow[];
    },
    enabled: !!tenantId,
  });

  const archive = useMutation({
    mutationFn: async () => {
      const next = tenant.data?.status === 'archived' ? 'active' : 'archived';
      const hasActive =
        (leases.data ?? []).some((l) => l.lease_status === 'active');
      if (next === 'archived' && hasActive) {
        throw new Error('Cannot archive a tenant with an active lease (FR-TEN-4).');
      }
      const { error } = await supabase
        .from('tenants')
        .update({ status: next })
        .eq('id', tenantId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', tenantId] }),
  });

  if (tenant.isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!tenant.data) return <EmptyState title="Tenant not found" />;
  const t = tenant.data;

  return (
    <div>
      <PageHeader
        title={t.full_name}
        subtitle={t.email ?? ''}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={t.status} />
            <button type="button" className="btn-secondary" onClick={() => archive.mutate()}>
              {t.status === 'archived' ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        }
      />

      {archive.error && (
        <div className="text-sm text-red-700 mb-3">{(archive.error as Error).message}</div>
      )}

      <section className="card p-5 mb-6">
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-500">Phone</dt>
            <dd className="mt-1">{t.phone ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Government ID</dt>
            <dd className="mt-1">
              {[t.gov_id_type, t.gov_id_number].filter(Boolean).join(' · ') || '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Emergency contact</dt>
            <dd className="mt-1">
              {[t.emergency_contact_name, t.emergency_contact_phone].filter(Boolean).join(' · ') ||
                '—'}
            </dd>
          </div>
          <div className="md:col-span-3">
            <dt className="text-xs uppercase text-slate-500">Notes</dt>
            <dd className="mt-1 whitespace-pre-wrap">{t.notes ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h2 className="text-base font-medium text-slate-900 mb-3">Lease history</h2>
        {(leases.data ?? []).length === 0 ? (
          <EmptyState title="No leases yet" />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Property · Unit</th>
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
                        {l.units?.properties?.name ?? '—'} · {l.units?.unit_label ?? '—'}
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
