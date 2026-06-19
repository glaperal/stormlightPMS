import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { fmtPHP } from '@/lib/format';
import { Detail } from '../Detail';
import type { LeaseFull } from '../types';

export function SettleDepositModal({
  open,
  onClose,
  lease,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  lease: LeaseFull;
  onDone: () => void;
}) {
  const qc = useQueryClient();
  const deductions = useQuery({
    queryKey: ['deductions', lease.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_deductions')
        .select('id, deduction_category, description, amount')
        .eq('lease_id', lease.id);
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        deduction_category: string;
        description: string;
        amount: string;
      }[];
    },
    enabled: open,
  });

  const [cat, setCat] = useState<'unpaid_utility' | 'damage'>('unpaid_utility');
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addDeduction = useMutation({
    mutationFn: async () => {
      const amount = Number(amt);
      if (!desc || !Number.isFinite(amount) || amount <= 0) {
        throw new Error('Description and a positive amount are required');
      }
      const { error: err } = await supabase.from('deposit_deductions').insert({
        org_id: lease.org_id,
        lease_id: lease.id,
        deduction_category: cat,
        description: desc,
        amount,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      setDesc('');
      setAmt('');
      qc.invalidateQueries({ queryKey: ['deductions', lease.id] });
    },
    onError: (e) => setError((e as Error).message),
  });

  const finalize = useMutation({
    mutationFn: async () => {
      const { error: err } = await supabase.rpc('finalize_lease_settlement', {
        p_lease_id: lease.id,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      onClose();
      onDone();
    },
    onError: (e) => setError((e as Error).message),
  });

  const totalDeducted = (deductions.data ?? []).reduce((s, d) => s + Number(d.amount), 0);
  const deposit = Number(lease.security_deposit_amount);
  const refund = Math.max(0, deposit - totalDeducted);
  const shortfall = Math.max(0, totalDeducted - deposit);

  return (
    <Modal open={open} onClose={onClose} title="Settle deposit" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Detail label="Deposit held" value={fmtPHP(deposit)} />
          <Detail label="Deductions" value={fmtPHP(totalDeducted)} />
          <Detail label="Refund" value={fmtPHP(refund)} />
          <Detail label="Shortfall" value={fmtPHP(shortfall)} />
        </div>

        <div>
          <h3 className="text-sm font-medium text-fg-1 mb-2">Itemized deductions</h3>
          {(deductions.data ?? []).length === 0 ? (
            <div className="text-sm text-fg-3">No deductions yet.</div>
          ) : (
            <ul className="text-sm divide-y divide-[var(--border-subtle)] border border rounded">
              {deductions.data!.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    <span className="badge bg-muted text-fg-2 mr-2">
                      {d.deduction_category.replace(/_/g, ' ')}
                    </span>
                    {d.description}
                  </span>
                  <span>{fmtPHP(d.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Category" htmlFor="d-cat">
            <select
              id="d-cat"
              className="input"
              value={cat}
              onChange={(e) => setCat(e.target.value as 'unpaid_utility' | 'damage')}
            >
              <option value="unpaid_utility">Unpaid utility</option>
              <option value="damage">Damage</option>
            </select>
          </Field>
          <Field label="Description" htmlFor="d-desc">
            <input id="d-desc" className="input" value={desc} onChange={(e) => setDesc(e.target.value)} />
          </Field>
          <Field label="Amount (₱)" htmlFor="d-amt">
            <input
              id="d-amt"
              type="number"
              step="0.01"
              min={0}
              className="input"
              value={amt}
              onChange={(e) => setAmt(e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() => addDeduction.mutate()}
              disabled={addDeduction.isPending}
            >
              Add
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-danger-700">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => finalize.mutate()}
            disabled={finalize.isPending}
          >
            {finalize.isPending ? 'Finalizing…' : 'Finalize settlement'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
