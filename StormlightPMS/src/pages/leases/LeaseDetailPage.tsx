import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { fmtDate, fmtPHP, manilaToday } from '@/lib/format';

interface LeaseFull {
  id: string;
  org_id: string;
  lease_status: 'draft' | 'active' | 'expired' | 'terminated' | 'renewed';
  start_date: string;
  end_date: string;
  monthly_rent: string;
  payment_due_day: number;
  advance_months: string;
  advance_amount: string;
  security_deposit_months: string;
  security_deposit_amount: string;
  escalation_rate: string;
  escalation_frequency_months: number;
  termination_date: string | null;
  termination_reason: string | null;
  deposit_settled_date: string | null;
  deposit_refund_amount: string | null;
  units: { id: string; unit_label: string; properties: { name: string; id: string } | null } | null;
  tenants: { id: string; full_name: string } | null;
}

interface ChargeRow {
  id: string;
  charge_type: string;
  description: string | null;
  billing_period: string | null;
  amount: string;
  due_date: string;
  charge_status: string;
}

interface PaymentRow {
  id: string;
  payment_date: string;
  amount: string;
  payment_method: string;
  payment_status: string;
  reference_no: string | null;
}

interface AllocationRow {
  id: string;
  payment_id: string;
  charge_id: string;
  amount_applied: string;
}

interface LedgerRow {
  charged_total: string;
  allocated_total: string;
  paid_total: string;
  outstanding_balance: string;
  unapplied_credit: string;
  deposit_held: string;
  advance_held: string;
}

export function LeaseDetailPage() {
  const { leaseId } = useParams();
  const qc = useQueryClient();
  const [chargeOpen, setChargeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);

  const lease = useQuery({
    queryKey: ['lease', leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select(
          '*, units(id, unit_label, properties(id, name)), tenants(id, full_name)',
        )
        .eq('id', leaseId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LeaseFull | null;
    },
    enabled: !!leaseId,
  });

  const charges = useQuery({
    queryKey: ['lease-charges', leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('charges')
        .select('id, charge_type, description, billing_period, amount, due_date, charge_status')
        .eq('lease_id', leaseId!)
        .order('due_date');
      if (error) throw error;
      return (data ?? []) as ChargeRow[];
    },
    enabled: !!leaseId,
  });

  const payments = useQuery({
    queryKey: ['lease-payments', leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('id, payment_date, amount, payment_method, payment_status, reference_no')
        .eq('lease_id', leaseId!)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PaymentRow[];
    },
    enabled: !!leaseId,
  });

  const allocations = useQuery({
    queryKey: ['lease-allocations', leaseId],
    queryFn: async () => {
      if (!payments.data?.length) return [] as AllocationRow[];
      const { data, error } = await supabase
        .from('payment_allocations')
        .select('id, payment_id, charge_id, amount_applied')
        .in('payment_id', payments.data.map((p) => p.id));
      if (error) throw error;
      return (data ?? []) as AllocationRow[];
    },
    enabled: !!leaseId && !!payments.data,
  });

  const ledger = useQuery({
    queryKey: ['lease-ledger', leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_lease_ledger')
        .select('*')
        .eq('lease_id', leaseId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LedgerRow | null;
    },
    enabled: !!leaseId,
    refetchInterval: 0,
  });

  const activate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('leases')
        .update({ lease_status: 'active' })
        .eq('id', leaseId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lease', leaseId] }),
  });

  if (lease.isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!lease.data) return <EmptyState title="Lease not found" />;
  const l = lease.data;

  return (
    <div>
      <PageHeader
        title={`Lease · ${l.units?.properties?.name ?? '—'} · ${l.units?.unit_label ?? '—'}`}
        subtitle={l.tenants?.full_name ?? ''}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={l.lease_status} />
            {l.lease_status === 'draft' && (
              <button type="button" className="btn-primary" onClick={() => activate.mutate()}>
                Activate
              </button>
            )}
            {l.lease_status === 'active' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setTerminateOpen(true)}
              >
                Terminate
              </button>
            )}
            {(l.lease_status === 'terminated' || l.lease_status === 'expired') &&
              !l.deposit_settled_date && (
                <button type="button" className="btn-primary" onClick={() => setSettleOpen(true)}>
                  Settle deposit
                </button>
              )}
          </div>
        }
      />

      {activate.error && (
        <div className="text-sm text-red-700 mb-3">{(activate.error as Error).message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-base font-medium text-slate-900 mb-3">Terms</h2>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Term" value={`${fmtDate(l.start_date)} – ${fmtDate(l.end_date)}`} />
            <Detail label="Monthly rent" value={fmtPHP(l.monthly_rent)} />
            <Detail label="Due day" value={String(l.payment_due_day)} />
            <Detail
              label="Advance"
              value={`${l.advance_months}mo · ${fmtPHP(l.advance_amount)}`}
            />
            <Detail
              label="Deposit"
              value={`${l.security_deposit_months}mo · ${fmtPHP(l.security_deposit_amount)}`}
            />
            <Detail
              label="Escalation"
              value={`${l.escalation_rate}% / ${l.escalation_frequency_months}mo`}
            />
            {l.termination_date && (
              <Detail label="Vacated" value={fmtDate(l.termination_date)} />
            )}
            {l.deposit_settled_date && (
              <Detail label="Settled" value={fmtDate(l.deposit_settled_date)} />
            )}
            {l.deposit_refund_amount && (
              <Detail label="Refund" value={fmtPHP(l.deposit_refund_amount)} />
            )}
          </dl>
        </div>

        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-medium text-slate-900 mb-3">Ledger</h2>
          {ledger.data ? (
            <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <Detail label="Charged total" value={fmtPHP(ledger.data.charged_total)} />
              <Detail label="Allocated" value={fmtPHP(ledger.data.allocated_total)} />
              <Detail
                label="Outstanding balance"
                value={fmtPHP(ledger.data.outstanding_balance)}
              />
              <Detail label="Unapplied credit" value={fmtPHP(ledger.data.unapplied_credit)} />
              <Detail label="Deposit held" value={fmtPHP(ledger.data.deposit_held)} />
              <Detail label="Advance held" value={fmtPHP(ledger.data.advance_held)} />
            </dl>
          ) : (
            <div className="text-sm text-slate-500">No ledger yet.</div>
          )}
        </div>
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-slate-900">Charges</h2>
          {l.lease_status !== 'expired' && l.lease_status !== 'renewed' && (
            <button type="button" className="btn-secondary" onClick={() => setChargeOpen(true)}>
              Add charge
            </button>
          )}
        </div>
        <ChargesTable
          rows={charges.data ?? []}
          allocations={allocations.data ?? []}
          payments={payments.data ?? []}
          onChanged={() => {
            qc.invalidateQueries({ queryKey: ['lease-charges', leaseId] });
            qc.invalidateQueries({ queryKey: ['lease-ledger', leaseId] });
          }}
        />
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-slate-900">Payments</h2>
          {l.lease_status !== 'expired' && l.lease_status !== 'renewed' && (
            <button type="button" className="btn-primary" onClick={() => setPaymentOpen(true)}>
              Record payment
            </button>
          )}
        </div>
        <PaymentsTable
          rows={payments.data ?? []}
          onChanged={() => {
            qc.invalidateQueries({ queryKey: ['lease-payments', leaseId] });
            qc.invalidateQueries({ queryKey: ['lease-charges', leaseId] });
            qc.invalidateQueries({ queryKey: ['lease-ledger', leaseId] });
            qc.invalidateQueries({ queryKey: ['lease-allocations', leaseId] });
          }}
        />
      </section>

      <NewChargeModal
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        leaseId={l.id}
        orgId={l.org_id}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['lease-charges', leaseId] });
          qc.invalidateQueries({ queryKey: ['lease-ledger', leaseId] });
        }}
      />
      <NewPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        leaseId={l.id}
        orgId={l.org_id}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['lease-payments', leaseId] });
          qc.invalidateQueries({ queryKey: ['lease-charges', leaseId] });
          qc.invalidateQueries({ queryKey: ['lease-ledger', leaseId] });
        }}
      />
      <TerminateModal
        open={terminateOpen}
        onClose={() => setTerminateOpen(false)}
        leaseId={l.id}
        onDone={() => qc.invalidateQueries({ queryKey: ['lease', leaseId] })}
      />
      <SettleDepositModal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        lease={l}
        onDone={() => {
          qc.invalidateQueries({ queryKey: ['lease', leaseId] });
          qc.invalidateQueries({ queryKey: ['lease-charges', leaseId] });
          qc.invalidateQueries({ queryKey: ['lease-ledger', leaseId] });
        }}
      />
      <p className="text-xs text-slate-500 mt-6">
        Tenant: <Link to={`/tenants/${l.tenants?.id}`} className="underline">{l.tenants?.full_name}</Link>{' '}
        · Unit:{' '}
        <Link to={`/units/${l.units?.id}`} className="underline">
          {l.units?.unit_label}
        </Link>
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}

// === Charges table ============================================================

function ChargesTable({
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
                      className="text-xs text-red-700 hover:underline"
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

// === Payments table ==========================================================

function PaymentsTable({
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
        <thead className="bg-slate-50 text-slate-600 text-left">
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
            <tr key={p.id} className="table-row border-t border-slate-100">
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
                      className="text-xs text-slate-700 hover:underline"
                      onClick={() => setAllocateFor(p)}
                    >
                      Allocate
                    </button>
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline"
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
        <div className="px-4 py-2 text-sm text-red-700">
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

// === Modals ==================================================================

const ChargeSchema = z.object({
  charge_type: z.enum([
    'rent',
    'utility_electricity',
    'utility_water',
    'association_dues',
    'parking',
    'penalty',
    'move_out_balance',
    'other',
  ]),
  description: z.string().optional(),
  billing_period: z.string().optional(),
  amount: z.coerce.number().positive('> 0'),
  due_date: z.string().min(1, 'Required'),
});
type ChargeFormValues = z.infer<typeof ChargeSchema>;

function NewChargeModal({
  open,
  onClose,
  leaseId,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  leaseId: string;
  orgId: string;
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(ChargeSchema),
    defaultValues: { charge_type: 'rent', due_date: manilaToday() },
  });
  const mutation = useMutation({
    mutationFn: async (values: ChargeFormValues) => {
      const { error } = await supabase.from('charges').insert({
        org_id: orgId,
        lease_id: leaseId,
        charge_type: values.charge_type,
        description: values.description || null,
        billing_period: values.billing_period || null,
        amount: values.amount,
        due_date: values.due_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      onClose();
      onCreated();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add charge" size="md">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Type" htmlFor="c-type" error={errors.charge_type?.message}>
            <select id="c-type" className="input" {...register('charge_type')}>
              <option value="rent">Rent</option>
              <option value="utility_electricity">Electricity</option>
              <option value="utility_water">Water</option>
              <option value="association_dues">Association / CUSA dues</option>
              <option value="parking">Parking</option>
              <option value="penalty">Penalty</option>
              <option value="move_out_balance">Move-out balance</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Amount (₱)" htmlFor="c-amount" error={errors.amount?.message}>
            <input id="c-amount" type="number" step="0.01" className="input" {...register('amount')} />
          </Field>
          <Field label="Billing period (first day)" htmlFor="c-period">
            <input id="c-period" type="date" className="input" {...register('billing_period')} />
          </Field>
          <Field label="Due date" htmlFor="c-due" error={errors.due_date?.message}>
            <input id="c-due" type="date" className="input" {...register('due_date')} />
          </Field>
        </div>
        <Field label="Description" htmlFor="c-desc">
          <input id="c-desc" className="input" {...register('description')} />
        </Field>
        {mutation.error && (
          <div className="text-sm text-red-700">{(mutation.error as Error).message}</div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

const PaymentSchema = z.object({
  payment_date: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('> 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'gcash', 'maya', 'check', 'other']),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
});
type PaymentFormValues = z.infer<typeof PaymentSchema>;

function NewPaymentModal({
  open,
  onClose,
  leaseId,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  leaseId: string;
  orgId: string;
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: { payment_date: manilaToday(), payment_method: 'cash' },
  });

  const mutation = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const session = (await supabase.auth.getUser()).data.user;
      if (!session) throw new Error('No session');
      const { error } = await supabase.from('payments').insert({
        org_id: orgId,
        lease_id: leaseId,
        payment_date: values.payment_date,
        amount: values.amount,
        payment_method: values.payment_method,
        reference_no: values.reference_no || null,
        notes: values.notes || null,
        recorded_by: session.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      onClose();
      onCreated();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Record payment">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date" htmlFor="pm-date" error={errors.payment_date?.message}>
            <input id="pm-date" type="date" className="input" {...register('payment_date')} />
          </Field>
          <Field label="Amount (₱)" htmlFor="pm-amt" error={errors.amount?.message}>
            <input id="pm-amt" type="number" step="0.01" className="input" {...register('amount')} />
          </Field>
          <Field label="Method" htmlFor="pm-method">
            <select id="pm-method" className="input" {...register('payment_method')}>
              <option value="cash">Cash</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
              <option value="check">Check</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Reference no." htmlFor="pm-ref">
            <input id="pm-ref" className="input" {...register('reference_no')} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="pm-notes">
          <textarea id="pm-notes" rows={2} className="input" {...register('notes')} />
        </Field>
        {mutation.error && (
          <div className="text-sm text-red-700">{(mutation.error as Error).message}</div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Record'}
          </button>
        </div>
      </form>
      <p className="text-xs text-slate-500 mt-2">
        After recording, use "Allocate" to apply this payment against open charges.
      </p>
    </Modal>
  );
}

function AllocateModal({
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

function TerminateModal({
  open,
  onClose,
  leaseId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  leaseId: string;
  onDone: () => void;
}) {
  const [date, setDate] = useState(manilaToday());
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: async () => {
      const { error: err } = await supabase
        .from('leases')
        .update({
          lease_status: 'terminated',
          termination_date: date,
          termination_reason: reason || null,
        })
        .eq('id', leaseId);
      if (err) throw err;
    },
    onSuccess: () => {
      setReason('');
      onClose();
      onDone();
    },
    onError: (e) => setError((e as Error).message),
  });

  return (
    <Modal open={open} onClose={onClose} title="Terminate lease">
      <div className="space-y-4">
        <Field label="Vacate date" htmlFor="tm-date">
          <input
            id="tm-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Reason" htmlFor="tm-reason">
          <textarea
            id="tm-reason"
            rows={3}
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        {error && <div className="text-sm text-red-700">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={() => mut.mutate()}
            disabled={mut.isPending}
          >
            {mut.isPending ? 'Terminating…' : 'Terminate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SettleDepositModal({
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
          <h3 className="text-sm font-medium text-slate-900 mb-2">Itemized deductions</h3>
          {(deductions.data ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No deductions yet.</div>
          ) : (
            <ul className="text-sm divide-y divide-slate-100 border border-slate-200 rounded">
              {deductions.data!.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-3 py-2">
                  <span>
                    <span className="badge bg-slate-100 text-slate-700 mr-2">
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

        {error && <div className="text-sm text-red-700">{error}</div>}
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
