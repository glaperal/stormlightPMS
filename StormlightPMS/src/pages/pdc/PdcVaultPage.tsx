import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP, manilaToday } from '@/lib/format';
import { useAuth } from '@/lib/auth';

type PdcStatus = 'vaulted' | 'deposited' | 'cleared' | 'bounced' | 'stale';

interface Pdc {
  id: string;
  lease_id: string;
  check_number: string;
  issuing_bank: string;
  check_date: string;
  amount: string;
  status: PdcStatus;
  leases: { tenants: { full_name: string } | null; units: { unit_label: string } | null } | null;
}

interface LeaseOption {
  id: string;
  tenants: { full_name: string } | null;
  units: { unit_label: string } | null;
}

const Schema = z.object({
  lease_id: z.string().uuid('Select a lease'),
  check_number: z.string().min(1, 'Required'),
  issuing_bank: z.string().min(1, 'Required'),
  check_date: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('> 0'),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof Schema>;

export function PdcVaultPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [bank, setBank] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<PdcStatus>('deposited');
  const [bulkError, setBulkError] = useState<string | null>(null);

  const checks = useQuery({
    queryKey: ['pdc', statusFilter, bank],
    queryFn: async () => {
      let q = supabase
        .from('post_dated_checks')
        .select(
          'id, lease_id, check_number, issuing_bank, check_date, amount, status, leases(tenants(full_name), units(unit_label))',
        )
        .order('check_date');
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      if (bank.trim()) q = q.ilike('issuing_bank', `%${bank.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Pdc[];
    },
  });

  const leaseOptions = useQuery({
    queryKey: ['pdc-lease-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leases')
        .select('id, tenants(full_name), units(unit_label)')
        .eq('lease_status', 'active');
      if (error) throw error;
      return (data ?? []) as unknown as LeaseOption[];
    },
  });

  const today = manilaToday();
  const soon = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }, [today]);

  const bulk = useMutation({
    mutationFn: async () => {
      const ids = [...selected];
      if (ids.length === 0) throw new Error('Select at least one check');
      const patch: Record<string, unknown> = { status: bulkStatus };
      if (bulkStatus === 'cleared') patch.cleared_date = today;
      if (bulkStatus === 'deposited') patch.deposited_date = today;
      if (bulkStatus === 'bounced') patch.bounced_reason = 'Marked bounced (bulk)';
      const { error } = await supabase.from('post_dated_checks').update(patch).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelected(new Set());
      setBulkError(null);
      qc.invalidateQueries({ queryKey: ['pdc'] });
    },
    onError: (e) => setBulkError((e as Error).message),
  });

  const rows = checks.data ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  return (
    <div>
      <PageHeader
        title="PDC vault"
        subtitle="Post-dated checks. A check only affects the ledger when it clears."
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            Record check
          </button>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <select className="input max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="vaulted">Vaulted</option>
          <option value="deposited">Deposited</option>
          <option value="cleared">Cleared</option>
          <option value="bounced">Bounced</option>
          <option value="stale">Stale</option>
        </select>
        <input
          className="input max-w-xs"
          placeholder="Filter by bank"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
        />
      </div>

      {selected.size > 0 && (
        <div className="card mb-3 flex flex-wrap items-center gap-3 p-3">
          <span className="text-sm text-slate-600">{selected.size} selected →</span>
          <select className="input max-w-xs" value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as PdcStatus)}>
            <option value="deposited">Mark deposited</option>
            <option value="cleared">Mark cleared (creates payments)</option>
            <option value="bounced">Mark bounced (voids payments)</option>
          </select>
          <button type="button" className="btn-primary" onClick={() => bulk.mutate()} disabled={bulk.isPending}>
            {bulk.isPending ? 'Applying…' : 'Apply'}
          </button>
          {bulkError && <span className="text-sm text-red-700">{bulkError}</span>}
        </div>
      )}

      <p className="mb-3 text-xs text-slate-500">
        Clearing a check records its money as an <em>unapplied</em> payment on the lease — open the
        lease ledger to allocate it to charges.
      </p>

      {rows.length === 0 ? (
        <EmptyState title="No post-dated checks" description="Record a check to start the vault." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="Select all"
                    checked={allSelected}
                    onChange={(e) =>
                      setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())
                    }
                  />
                </th>
                <th className="px-4 py-3 font-medium">Maturity</th>
                <th className="px-4 py-3 font-medium">Unit · Tenant</th>
                <th className="px-4 py-3 font-medium">Bank · No.</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const maturingSoon =
                  (r.status === 'vaulted' || r.status === 'deposited') &&
                  r.check_date >= today &&
                  r.check_date <= soon;
                return (
                  <tr key={r.id} className="table-row border-t border-slate-100">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select check ${r.check_number}`}
                        checked={selected.has(r.id)}
                        onChange={(e) => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {fmtDate(r.check_date)}
                      {maturingSoon && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                          soon
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/leases/${r.lease_id}`} className="hover:underline">
                        {r.leases?.units?.unit_label ?? '—'} · {r.leases?.tenants?.full_name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {r.issuing_bank} · {r.check_number}
                    </td>
                    <td className="px-4 py-3">{fmtPHP(r.amount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={r.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <NewCheckModal
        open={open}
        onClose={() => setOpen(false)}
        leases={leaseOptions.data ?? []}
        onCreated={() => qc.invalidateQueries({ queryKey: ['pdc'] })}
      />
    </div>
  );
}

function NewCheckModal({
  open,
  onClose,
  leases,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  leases: LeaseOption[];
  onCreated: () => void;
}) {
  const { claims } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(Schema) });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!claims.org_id) throw new Error('No org context');
      const { error } = await supabase.from('post_dated_checks').insert({
        org_id: claims.org_id,
        lease_id: values.lease_id,
        check_number: values.check_number,
        issuing_bank: values.issuing_bank,
        check_date: values.check_date,
        amount: values.amount,
        notes: values.notes || null,
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
    <Modal open={open} onClose={onClose} title="Record post-dated check">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Lease" htmlFor="p-lease" error={errors.lease_id?.message}>
          <select id="p-lease" className="input" {...register('lease_id')}>
            <option value="">— select lease —</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.units?.unit_label ?? '—'} · {l.tenants?.full_name ?? '—'}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Issuing bank" htmlFor="p-bank" error={errors.issuing_bank?.message}>
            <input id="p-bank" className="input" {...register('issuing_bank')} />
          </Field>
          <Field label="Check number" htmlFor="p-num" error={errors.check_number?.message}>
            <input id="p-num" className="input" {...register('check_number')} />
          </Field>
          <Field label="Maturity date" htmlFor="p-date" error={errors.check_date?.message}>
            <input id="p-date" type="date" className="input" {...register('check_date')} />
          </Field>
          <Field label="Amount (₱)" htmlFor="p-amount" error={errors.amount?.message}>
            <input id="p-amount" type="number" step="0.01" className="input" {...register('amount')} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="p-notes">
          <input id="p-notes" className="input" {...register('notes')} />
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
    </Modal>
  );
}
