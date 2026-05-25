import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';
import type { AllocationRow, ChargeRow, PaymentRow } from './types';

export function ChargesTable({
  rows,
  allocations,
  payments,
  onChanged,
}: {
  rows: ChargeRow[];
  allocations: AllocationRow[];
  payments: PaymentRow[];
  onChanged: () => void;
}) {
  const voidCharge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('charges')
        .update({ charge_status: 'void' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: onChanged,
  });

  if (!rows.length) return <EmptyState title="No charges" />;
  const activePayments = new Set(
    payments.filter((p) => p.payment_status === 'active').map((p) => p.id),
  );

  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Period</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Applied</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const applied = allocations
              .filter((a) => a.charge_id === c.id && activePayments.has(a.payment_id))
              .reduce((s, a) => s + Number(a.amount_applied), 0);
            return (
              <tr key={c.id} className="table-row border-t border-slate-100">
                <td className="px-4 py-3">{c.billing_period ? fmtDate(c.billing_period) : '—'}</td>
                <td className="px-4 py-3">{c.charge_type}</td>
                <td className="px-4 py-3">{c.description ?? '—'}</td>
                <td className="px-4 py-3">{fmtPHP(c.amount)}</td>
                <td className="px-4 py-3">{fmtPHP(applied)}</td>
                <td className="px-4 py-3">{fmtDate(c.due_date)}</td>
                <td className="px-4 py-3">
                  <StatusBadge value={c.charge_status} />
                </td>
                <td className="px-4 py-3 text-right">
                  {c.charge_status !== 'void' && applied === 0 && (
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline focus:outline-none focus:ring-2 focus:ring-red-400 rounded px-1"
                      onClick={() => voidCharge.mutate(c.id)}
                    >
                      Void
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {voidCharge.error && (
        <div className="px-4 py-2 text-sm text-red-700">{(voidCharge.error as Error).message}</div>
      )}
    </div>
  );
}
