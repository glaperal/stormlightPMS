import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';
import { Detail } from './LeaseDetail/Detail';
import { ChargesTable } from './LeaseDetail/ChargesTable';
import { PaymentsTable } from './LeaseDetail/PaymentsTable';
import { NewChargeModal } from './LeaseDetail/modals/NewChargeModal';
import { NewPaymentModal } from './LeaseDetail/modals/NewPaymentModal';
import { TerminateModal } from './LeaseDetail/modals/TerminateModal';
import { SettleDepositModal } from './LeaseDetail/modals/SettleDepositModal';
import type {
  AllocationRow,
  ChargeRow,
  LeaseFull,
  LedgerRow,
  PaymentRow,
} from './LeaseDetail/types';

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

  if (lease.isLoading) return <div className="text-sm text-fg-3">Loading…</div>;
  if (!lease.data) return <EmptyState title="Lease not found" />;
  const l = lease.data;

  const invalidateMoney = () => {
    qc.invalidateQueries({ queryKey: ['lease-charges', leaseId] });
    qc.invalidateQueries({ queryKey: ['lease-payments', leaseId] });
    qc.invalidateQueries({ queryKey: ['lease-allocations', leaseId] });
    qc.invalidateQueries({ queryKey: ['lease-ledger', leaseId] });
  };

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
        <div className="text-sm text-danger-700 mb-3">{(activate.error as Error).message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-5 lg:col-span-1">
          <h2 className="text-base font-medium text-fg-1 mb-3">Terms</h2>
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
          <h2 className="text-base font-medium text-fg-1 mb-3">Ledger</h2>
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
            <div className="text-sm text-fg-3">No ledger yet.</div>
          )}
        </div>
      </div>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-fg-1">Charges</h2>
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
          onChanged={invalidateMoney}
        />
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-fg-1">Payments</h2>
          {l.lease_status !== 'expired' && l.lease_status !== 'renewed' && (
            <button type="button" className="btn-primary" onClick={() => setPaymentOpen(true)}>
              Record payment
            </button>
          )}
        </div>
        <PaymentsTable rows={payments.data ?? []} onChanged={invalidateMoney} />
      </section>

      <NewChargeModal
        open={chargeOpen}
        onClose={() => setChargeOpen(false)}
        leaseId={l.id}
        orgId={l.org_id}
        onCreated={invalidateMoney}
      />
      <NewPaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        leaseId={l.id}
        orgId={l.org_id}
        onCreated={invalidateMoney}
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
          invalidateMoney();
        }}
      />
      <p className="text-xs text-fg-3 mt-6">
        Tenant:{' '}
        <Link to={`/tenants/${l.tenants?.id}`} className="underline">
          {l.tenants?.full_name}
        </Link>{' '}
        · Unit:{' '}
        <Link to={`/units/${l.units?.id}`} className="underline">
          {l.units?.unit_label}
        </Link>
      </p>
    </div>
  );
}
