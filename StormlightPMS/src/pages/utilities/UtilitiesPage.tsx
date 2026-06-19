import { useState } from 'react';
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
import { fmtDate, fmtPHP } from '@/lib/format';
import { useAuth } from '@/lib/auth';

const Schema = z.object({
  property_id: z.string().uuid('Select a property'),
  utility_type: z.enum(['electricity', 'water']),
  billing_period: z.string().min(1, 'Required'),
  provider: z.string().optional(),
  total_amount: z.coerce.number().positive('Must be greater than 0'),
  total_consumption: z.string().optional(),
  bill_date: z.string().optional(),
  due_date: z.string().min(1, 'Required'),
  allocation_method: z.enum(['by_submeter', 'equal_split', 'by_floor_area']),
});
type FormValues = z.infer<typeof Schema>;

interface Bill {
  id: string;
  utility_type: 'electricity' | 'water';
  billing_period: string;
  provider: string | null;
  total_amount: string;
  due_date: string;
  allocation_method: string;
  charges_generated_at: string | null;
  properties: { name: string } | null;
}

interface PropertyOption {
  id: string;
  name: string;
  org_id: string;
}

export function UtilitiesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const bills = useQuery({
    queryKey: ['utility-bills'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('utility_bills')
        .select(
          'id, utility_type, billing_period, provider, total_amount, due_date, allocation_method, charges_generated_at, properties(name)',
        )
        .order('billing_period', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Bill[];
    },
  });

  const properties = useQuery({
    queryKey: ['properties-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, org_id')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return (data ?? []) as unknown as PropertyOption[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Utilities"
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            New utility bill
          </button>
        }
      />

      {(bills.data ?? []).length === 0 ? (
        <EmptyState
          title="No utility bills"
          description="Enter a master bill, then add per-lease meter readings."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Charges</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bills.data!.map((b) => (
                <tr key={b.id} className="table-row border-t border-slate-100">
                  <td className="px-4 py-3">{fmtDate(b.billing_period)}</td>
                  <td className="px-4 py-3">{b.properties?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={b.utility_type === 'electricity' ? 'electricity' : 'water'} />
                  </td>
                  <td className="px-4 py-3">{fmtPHP(b.total_amount)}</td>
                  <td className="px-4 py-3">{fmtDate(b.due_date)}</td>
                  <td className="px-4 py-3">
                    {b.charges_generated_at ? (
                      <span className="text-xs text-emerald-700">Generated</span>
                    ) : (
                      <span className="text-xs text-slate-500">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/utilities/${b.id}`} className="text-xs text-slate-700 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewBillModal
        open={open}
        onClose={() => setOpen(false)}
        properties={properties.data ?? []}
        onCreated={() => qc.invalidateQueries({ queryKey: ['utility-bills'] })}
      />
    </div>
  );
}

function NewBillModal({
  open,
  onClose,
  properties,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  properties: PropertyOption[];
  onCreated: () => void;
}) {
  const { claims } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { utility_type: 'electricity', allocation_method: 'by_submeter' },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const prop = properties.find((p) => p.id === values.property_id);
      const orgId = prop?.org_id ?? claims.org_id;
      if (!orgId) throw new Error('No org context');
      const { error } = await supabase.from('utility_bills').insert({
        org_id: orgId,
        property_id: values.property_id,
        utility_type: values.utility_type,
        billing_period: values.billing_period,
        provider: values.provider || null,
        total_amount: values.total_amount,
        total_consumption: values.total_consumption ? Number(values.total_consumption) : null,
        bill_date: values.bill_date || null,
        due_date: values.due_date,
        allocation_method: values.allocation_method,
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
    <Modal open={open} onClose={onClose} title="New utility bill">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Property" htmlFor="u-prop" error={errors.property_id?.message}>
          <select id="u-prop" className="input" {...register('property_id')}>
            <option value="">— select property —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Utility" htmlFor="u-type">
            <select id="u-type" className="input" {...register('utility_type')}>
              <option value="electricity">Electricity</option>
              <option value="water">Water</option>
            </select>
          </Field>
          <Field label="Allocation method" htmlFor="u-alloc">
            <select id="u-alloc" className="input" {...register('allocation_method')}>
              <option value="by_submeter">By sub-meter (consumption)</option>
              <option value="equal_split">Equal split</option>
              <option value="by_floor_area">By floor area</option>
            </select>
          </Field>
          <Field label="Billing period" htmlFor="u-period" error={errors.billing_period?.message}>
            <input id="u-period" type="date" className="input" {...register('billing_period')} />
          </Field>
          <Field label="Due date" htmlFor="u-due" error={errors.due_date?.message}>
            <input id="u-due" type="date" className="input" {...register('due_date')} />
          </Field>
          <Field label="Provider" htmlFor="u-provider">
            <input id="u-provider" className="input" placeholder="Meralco / Maynilad" {...register('provider')} />
          </Field>
          <Field label="Total amount (₱)" htmlFor="u-total" error={errors.total_amount?.message}>
            <input id="u-total" type="number" step="0.01" min={0} className="input" {...register('total_amount')} />
          </Field>
          <Field label="Total consumption" htmlFor="u-cons">
            <input id="u-cons" type="number" step="0.01" min={0} className="input" {...register('total_consumption')} />
          </Field>
          <Field label="Bill date" htmlFor="u-billdate">
            <input id="u-billdate" type="date" className="input" {...register('bill_date')} />
          </Field>
        </div>
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
