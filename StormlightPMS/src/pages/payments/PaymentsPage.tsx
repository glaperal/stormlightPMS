import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP, manilaToday } from '@/lib/format';
import { exportCsv } from '@/lib/csv';

interface PaymentRow {
  id: string;
  lease_id: string;
  payment_date: string;
  amount: string;
  payment_method: string;
  payment_status: string;
  reference_no: string | null;
  leases: {
    tenants: { full_name: string } | null;
    units: { unit_label: string; properties: { name: string } | null } | null;
  } | null;
}

export function PaymentsPage() {
  const today = manilaToday();
  const [from, setFrom] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(today);
  const [method, setMethod] = useState<'all' | string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['payments-list', from, to, method],
    queryFn: async () => {
      let q = supabase
        .from('payments')
        .select(
          'id, lease_id, payment_date, amount, payment_method, payment_status, reference_no, leases(tenants(full_name), units(unit_label, properties(name)))',
        )
        .gte('payment_date', from)
        .lte('payment_date', to)
        .order('payment_date', { ascending: false })
        .limit(500);
      if (method !== 'all') q = q.eq('payment_method', method);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as PaymentRow[];
    },
  });

  const total = useMemo(
    () =>
      (data ?? [])
        .filter((p) => p.payment_status === 'active')
        .reduce((s, p) => s + Number(p.amount), 0),
    [data],
  );

  function onExport() {
    const rows = (data ?? []).map((p) => ({
      date: p.payment_date,
      property: p.leases?.units?.properties?.name ?? '',
      unit: p.leases?.units?.unit_label ?? '',
      tenant: p.leases?.tenants?.full_name ?? '',
      amount: Number(p.amount).toFixed(2),
      method: p.payment_method,
      reference: p.reference_no ?? '',
      status: p.payment_status,
    }));
    exportCsv(`payments_${from}_${to}.csv`, rows);
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle={`Active total: ${fmtPHP(total)}`}
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
          <label className="label">Method</label>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="all">All</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="gcash">GCash</option>
            <option value="maya">Maya</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No payments in this period" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Property · Unit</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((p) => (
                <tr key={p.id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">{fmtDate(p.payment_date)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/leases/${p.lease_id}`} className="text-fg-1 hover:underline">
                      {p.leases?.units?.properties?.name ?? '—'} ·{' '}
                      {p.leases?.units?.unit_label ?? '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.leases?.tenants?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">{fmtPHP(p.amount)}</td>
                  <td className="px-4 py-3">{p.payment_method}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={p.payment_status} />
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
