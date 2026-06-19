import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Field } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmtDate, fmtPHP } from '@/lib/format';

interface Bill {
  id: string;
  org_id: string;
  property_id: string;
  utility_type: 'electricity' | 'water';
  billing_period: string;
  provider: string | null;
  total_amount: string;
  due_date: string;
  allocation_method: 'by_submeter' | 'equal_split' | 'by_floor_area';
  charges_generated_at: string | null;
  properties: { name: string } | null;
}

interface Reading {
  id: string;
  lease_id: string;
  previous_reading: string;
  current_reading: string;
  consumption: string;
  computed_share: string | null;
  generated_charge_id: string | null;
  leases: { tenants: { full_name: string } | null; units: { unit_label: string } | null } | null;
}

interface LeaseOption {
  id: string;
  tenants: { full_name: string } | null;
  units: { unit_label: string } | null;
}

interface PreviewRow {
  lease_id: string;
  consumption: string;
  floor_area_sqm: string | null;
  computed_share: string;
}

const ALLOC_LABEL: Record<Bill['allocation_method'], string> = {
  by_submeter: 'By sub-meter (consumption)',
  equal_split: 'Equal split',
  by_floor_area: 'By floor area',
};

export function UtilityBillDetailPage() {
  const { billId = '' } = useParams();
  const qc = useQueryClient();
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bill = useQuery({
    queryKey: ['utility-bill', billId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('utility_bills')
        .select(
          'id, org_id, property_id, utility_type, billing_period, provider, total_amount, due_date, allocation_method, charges_generated_at, properties(name)',
        )
        .eq('id', billId)
        .single();
      if (err) throw err;
      return data as unknown as Bill;
    },
  });

  const readings = useQuery({
    queryKey: ['utility-readings', billId],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('utility_meter_readings')
        .select(
          'id, lease_id, previous_reading, current_reading, consumption, computed_share, generated_charge_id, leases(tenants(full_name), units(unit_label))',
        )
        .eq('utility_bill_id', billId);
      if (err) throw err;
      return (data ?? []) as unknown as Reading[];
    },
  });

  const leaseOptions = useQuery({
    queryKey: ['utility-lease-options', bill.data?.property_id],
    enabled: !!bill.data?.property_id,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from('leases')
        .select('id, tenants(full_name), units!inner(unit_label, property_id)')
        .eq('lease_status', 'active')
        .eq('units.property_id', bill.data!.property_id);
      if (err) throw err;
      return (data ?? []) as unknown as LeaseOption[];
    },
  });

  const generated = !!bill.data?.charges_generated_at;
  const total = Number(bill.data?.total_amount ?? 0);
  const previewTotal = (preview ?? []).reduce((s, r) => s + Number(r.computed_share), 0);
  const variance = total - previewTotal;

  const runPreview = useMutation({
    mutationFn: async () => {
      const { data, error: err } = await supabase.rpc('preview_utility_charges', {
        p_utility_bill_id: billId,
      });
      if (err) throw err;
      return (data ?? []) as unknown as PreviewRow[];
    },
    onSuccess: (rows) => {
      setPreview(rows);
      setError(null);
    },
    onError: (e) => setError((e as Error).message),
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error: err } = await supabase.rpc('generate_utility_charges', {
        p_utility_bill_id: billId,
      });
      if (err) throw err;
      return (Array.isArray(data) ? data[0] : data) as {
        charges_created: number;
        allocated_total: string;
        variance: string;
      };
    },
    onSuccess: (res) => {
      setGenResult(
        `Created ${res.charges_created} charge(s); allocated ${fmtPHP(res.allocated_total)}, common-area variance ${fmtPHP(res.variance)}.`,
      );
      setError(null);
      qc.invalidateQueries({ queryKey: ['utility-bill', billId] });
      qc.invalidateQueries({ queryKey: ['utility-readings', billId] });
    },
    onError: (e) => setError((e as Error).message),
  });

  if (bill.isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!bill.data) return <EmptyState title="Bill not found" />;

  const usedLeaseIds = new Set((readings.data ?? []).map((r) => r.lease_id));
  const availableLeases = (leaseOptions.data ?? []).filter((l) => !usedLeaseIds.has(l.id));

  return (
    <div>
      <PageHeader
        title={`${bill.data.utility_type === 'electricity' ? 'Electricity' : 'Water'} — ${fmtDate(bill.data.billing_period)}`}
        subtitle={bill.data.properties?.name ?? undefined}
        actions={
          <Link to="/utilities" className="btn-secondary">
            Back
          </Link>
        }
      />

      <div className="card p-4 mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <Metric label="Total amount" value={fmtPHP(bill.data.total_amount)} />
        <Metric label="Due date" value={fmtDate(bill.data.due_date)} />
        <Metric label="Allocation" value={ALLOC_LABEL[bill.data.allocation_method]} />
        <Metric label="Provider" value={bill.data.provider ?? '—'} />
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-slate-700">Per-lease meter readings</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => runPreview.mutate()}
            disabled={runPreview.isPending || (readings.data ?? []).length === 0}
          >
            {runPreview.isPending ? 'Computing…' : 'Preview shares'}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => generate.mutate()}
            disabled={generate.isPending || generated || (readings.data ?? []).length === 0}
            title={generated ? 'Charges already generated for this bill' : undefined}
          >
            {generated ? 'Charges generated' : generate.isPending ? 'Generating…' : 'Generate charges'}
          </button>
        </div>
      </div>

      {error && <div className="mb-3 text-sm text-red-700">{error}</div>}
      {genResult && <div className="mb-3 text-sm text-emerald-700">{genResult}</div>}

      {preview && (
        <div className="card p-3 mb-4 text-sm">
          <div className="font-medium text-slate-700 mb-1">Preview (not yet billed)</div>
          <div className="text-slate-600">
            Σ shares {fmtPHP(previewTotal)} of {fmtPHP(total)} ·{' '}
            <span className={variance === 0 ? 'text-slate-600' : 'text-amber-700'}>
              common-area / system-loss variance {fmtPHP(variance)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            The variance is surfaced for review and is not silently distributed (FR-UTIL-3).
          </p>
        </div>
      )}

      {(readings.data ?? []).length === 0 ? (
        <EmptyState title="No readings yet" description="Add a reading per active lease below." />
      ) : (
        <div className="card overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Unit · Tenant</th>
                <th className="px-4 py-3 font-medium">Previous</th>
                <th className="px-4 py-3 font-medium">Current</th>
                <th className="px-4 py-3 font-medium">Consumption</th>
                <th className="px-4 py-3 font-medium">Share</th>
              </tr>
            </thead>
            <tbody>
              {readings.data!.map((r) => {
                const pv = preview?.find((p) => p.lease_id === r.lease_id);
                return (
                  <tr key={r.id} className="table-row border-t border-slate-100">
                    <td className="px-4 py-3">
                      {r.leases?.units?.unit_label ?? '—'} · {r.leases?.tenants?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">{r.previous_reading}</td>
                    <td className="px-4 py-3">{r.current_reading}</td>
                    <td className="px-4 py-3">{r.consumption}</td>
                    <td className="px-4 py-3">
                      {r.computed_share != null
                        ? fmtPHP(r.computed_share)
                        : pv
                          ? `${fmtPHP(pv.computed_share)} (preview)`
                          : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!generated && (
        <AddReadingForm
          billId={billId}
          orgId={bill.data.org_id}
          leases={availableLeases}
          onAdded={() => {
            setPreview(null);
            qc.invalidateQueries({ queryKey: ['utility-readings', billId] });
          }}
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 font-medium text-slate-900">{value}</div>
    </div>
  );
}

function AddReadingForm({
  billId,
  orgId,
  leases,
  onAdded,
}: {
  billId: string;
  orgId: string;
  leases: LeaseOption[];
  onAdded: () => void;
}) {
  const [leaseId, setLeaseId] = useState('');
  const [prev, setPrev] = useState('');
  const [cur, setCur] = useState('');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const p = Number(prev);
      const c = Number(cur);
      if (!leaseId) throw new Error('Select a lease');
      if (!Number.isFinite(p) || !Number.isFinite(c)) throw new Error('Enter numeric readings');
      if (c < p) throw new Error('Current reading must be ≥ previous reading');
      const { error: err } = await supabase.from('utility_meter_readings').insert({
        org_id: orgId,
        utility_bill_id: billId,
        lease_id: leaseId,
        previous_reading: p,
        current_reading: c,
        consumption: c - p,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      setLeaseId('');
      setPrev('');
      setCur('');
      setError(null);
      onAdded();
    },
    onError: (e) => setError((e as Error).message),
  });

  if (leases.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        All active leases on this property already have a reading.
      </p>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-sm font-medium text-slate-700 mb-3">Add reading</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <Field label="Lease" htmlFor="r-lease">
          <select id="r-lease" className="input" value={leaseId} onChange={(e) => setLeaseId(e.target.value)}>
            <option value="">— select lease —</option>
            {leases.map((l) => (
              <option key={l.id} value={l.id}>
                {l.units?.unit_label ?? '—'} · {l.tenants?.full_name ?? '—'}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Previous" htmlFor="r-prev">
          <input id="r-prev" type="number" step="0.01" className="input" value={prev} onChange={(e) => setPrev(e.target.value)} />
        </Field>
        <Field label="Current" htmlFor="r-cur">
          <input id="r-cur" type="number" step="0.01" className="input" value={cur} onChange={(e) => setCur(e.target.value)} />
        </Field>
        <button
          type="button"
          className="btn-primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Adding…' : 'Add'}
        </button>
      </div>
      {error && <div className="mt-2 text-sm text-red-700">{error}</div>}
    </div>
  );
}
