import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { fmtDate, fmtPHP } from '@/lib/format';
import type { ChargeRow, PaymentRow } from '../types';

export function AllocateModal({
  payment,
  onClose,
  onChanged,
}: {
  payment: PaymentRow | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const open = !!payment;
  const { leaseId } = useParams();
  const qc = useQueryClient();
  const charges = useQuery({
    queryKey: ['allocate-charges', leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('charges')
        .select('id, amount, charge_type, description, due_date, charge_status')
        .eq('lease_id', leaseId!)
        .in('charge_status', ['unpaid', 'partially_paid'])
        .order('due_date');
      if (error) throw error;
      return (data ?? []) as ChargeRow[];
    },
    enabled: open && !!leaseId,
  });

  const [chargeId, setChargeId] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const allocate = useMutation({
    mutationFn: async () => {
      if (!payment) return;
      if (!chargeId) throw new Error('Pick a charge');
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error('Amount must be > 0');
      const orgRes = await supabase.from('payments').select('org_id').eq('id', payment.id).single();
      if (orgRes.error) throw orgRes.error;
      const { error: insertErr } = await supabase
        .from('payment_allocations')
        .upsert(
          {
            org_id: orgRes.data.org_id,
            payment_id: payment.id,
            charge_id: chargeId,
            amount_applied: amt,
          },
          { onConflict: 'payment_id,charge_id' },
        );
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      setChargeId('');
      setAmount('');
      setError(null);
      onClose();
      qc.invalidateQueries({ queryKey: ['allocate-charges', leaseId] });
      onChanged();
    },
    onError: (e) => setError((e as Error).message),
  });

  if (!open || !payment) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Allocate ${fmtPHP(payment.amount)}`}>
      <div className="space-y-4">
        <Field label="Charge" htmlFor="al-charge">
          <select
            id="al-charge"
            className="input"
            value={chargeId}
            onChange={(e) => setChargeId(e.target.value)}
          >
            <option value="">— select open charge —</option>
            {(charges.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.charge_type} · {fmtDate(c.due_date)} · {fmtPHP(c.amount)} (
                {c.charge_status})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount to apply (₱)" htmlFor="al-amt">
          <input
            id="al-amt"
            className="input"
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        {error && <div className="text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={allocate.isPending}
            onClick={() => allocate.mutate()}
          >
            {allocate.isPending ? 'Allocating…' : 'Allocate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
