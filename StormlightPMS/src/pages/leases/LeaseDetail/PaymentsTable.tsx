import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';
import type { PaymentRow } from './types';
import { AllocateModal } from './modals/AllocateModal';

export function PaymentsTable({
  rows,
  onChanged,
}: {
  rows: PaymentRow[];
  onChanged: () => void;
}) {
  const voidPayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payments')
        .update({ payment_status: 'void' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: onChanged,
  });

  const [allocateFor, setAllocateFor] = useState<PaymentRow | null>(null);

  if (!rows.length) return <EmptyState title="No payments" />;
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-subtle text-fg-2 text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Ref</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="table-row border-t border-subtle">
              <td className="px-4 py-3">{fmtDate(p.payment_date)}</td>
              <td className="px-4 py-3">{fmtPHP(p.amount)}</td>
              <td className="px-4 py-3">{p.payment_method}</td>
              <td className="px-4 py-3">{p.reference_no ?? '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge value={p.payment_status} />
              </td>
              <td className="px-4 py-3 text-right space-x-3">
                {p.payment_status === 'active' && (
                  <>
                    <button
                      type="button"
                      className="text-xs text-fg-2 hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
                      onClick={() => setAllocateFor(p)}
                    >
                      Allocate
                    </button>
                    <button
                      type="button"
                      className="text-xs text-danger-700 hover:underline focus:outline-none focus:ring-2 focus:ring-danger rounded px-1"
                      onClick={() => voidPayment.mutate(p.id)}
                    >
                      Void
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {voidPayment.error && (
        <div className="px-4 py-2 text-sm text-danger-700">
          {(voidPayment.error as Error).message}
        </div>
      )}
      <AllocateModal
        payment={allocateFor}
        onClose={() => setAllocateFor(null)}
        onChanged={onChanged}
      />
    </div>
  );
}
