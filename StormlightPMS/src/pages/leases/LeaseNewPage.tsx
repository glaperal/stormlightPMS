import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth';

const LeaseSchema = z
  .object({
    unit_id: z.string().uuid('Select a unit'),
    tenant_id: z.string().uuid('Select a tenant'),
    start_date: z.string().min(1, 'Required'),
    end_date: z.string().min(1, 'Required'),
    monthly_rent: z.coerce.number().positive('> 0'),
    payment_due_day: z.coerce.number().int().min(1).max(28),
    advance_months: z.coerce.number().min(0),
    advance_amount: z.coerce.number().min(0),
    security_deposit_months: z.coerce.number().min(0),
    security_deposit_amount: z.coerce.number().min(0),
    escalation_rate: z.coerce.number().min(0).default(0),
    escalation_frequency_months: z.coerce.number().int().min(1).default(12),
  })
  .refine((d) => d.end_date >= d.start_date, {
    path: ['end_date'],
    message: 'End date must be on or after start date',
  });

type LeaseFormValues = z.infer<typeof LeaseSchema>;

export function LeaseNewPage() {
  const { claims } = useAuth();
  const navigate = useNavigate();

  const units = useQuery({
    queryKey: ['vacant-units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_label, base_monthly_rent, properties(name)')
        .eq('unit_status', 'vacant')
        .order('unit_label');
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        unit_label: string;
        base_monthly_rent: string;
        properties: { name: string } | null;
      }[];
    },
  });

  const tenants = useQuery({
    queryKey: ['tenants-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, full_name')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string }[];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeaseFormValues>({
    resolver: zodResolver(LeaseSchema),
    defaultValues: {
      payment_due_day: 5,
      advance_months: 1,
      security_deposit_months: 2,
      escalation_rate: 0,
      escalation_frequency_months: 12,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: LeaseFormValues) => {
      const orgId = claims.org_id;
      if (!orgId) throw new Error('No org context');
      const { data, error } = await supabase
        .from('leases')
        .insert({
          ...values,
          org_id: orgId,
          lease_status: 'draft',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => navigate(`/leases/${id}`),
  });

  const noUnits = useMemo(
    () => !units.isLoading && (units.data ?? []).length === 0,
    [units.isLoading, units.data],
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="New lease" subtitle="Create a draft lease. Activation moves the unit to occupied." />
      {noUnits && (
        <div className="card p-4 text-sm text-slate-700 mb-4">
          No vacant units available. Mark a unit vacant first, or add a new unit.
        </div>
      )}
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="card p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Unit" htmlFor="l-unit" error={errors.unit_id?.message}>
            <select id="l-unit" className="input" {...register('unit_id')}>
              <option value="">— select vacant unit —</option>
              {(units.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.properties?.name ?? '—'} · {u.unit_label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tenant" htmlFor="l-tenant" error={errors.tenant_id?.message}>
            <select id="l-tenant" className="input" {...register('tenant_id')}>
              <option value="">— select tenant —</option>
              {(tenants.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Start date" htmlFor="l-start" error={errors.start_date?.message}>
            <input id="l-start" type="date" className="input" {...register('start_date')} />
          </Field>
          <Field label="End date" htmlFor="l-end" error={errors.end_date?.message}>
            <input id="l-end" type="date" className="input" {...register('end_date')} />
          </Field>

          <Field label="Monthly rent (₱)" htmlFor="l-rent" error={errors.monthly_rent?.message}>
            <input id="l-rent" type="number" step="0.01" className="input" {...register('monthly_rent')} />
          </Field>
          <Field label="Payment due day (1–28)" htmlFor="l-due" error={errors.payment_due_day?.message}>
            <input id="l-due" type="number" min={1} max={28} className="input" {...register('payment_due_day')} />
          </Field>

          <Field label="Advance months" htmlFor="l-adv">
            <input id="l-adv" type="number" step="0.5" min={0} className="input" {...register('advance_months')} />
          </Field>
          <Field label="Advance amount (₱)" htmlFor="l-advamt">
            <input
              id="l-advamt"
              type="number"
              step="0.01"
              min={0}
              className="input"
              {...register('advance_amount')}
            />
          </Field>

          <Field label="Security deposit months" htmlFor="l-dep">
            <input id="l-dep" type="number" step="0.5" min={0} className="input" {...register('security_deposit_months')} />
          </Field>
          <Field label="Security deposit amount (₱)" htmlFor="l-depamt">
            <input
              id="l-depamt"
              type="number"
              step="0.01"
              min={0}
              className="input"
              {...register('security_deposit_amount')}
            />
          </Field>

          <Field label="Escalation rate (%)" htmlFor="l-esc">
            <input id="l-esc" type="number" step="0.01" min={0} className="input" {...register('escalation_rate')} />
          </Field>
          <Field label="Escalation frequency (months)" htmlFor="l-escf">
            <input id="l-escf" type="number" min={1} className="input" {...register('escalation_frequency_months')} />
          </Field>
        </div>
        {mutation.error && (
          <div className="text-sm text-red-700">{(mutation.error as Error).message}</div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate('/leases')}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Create draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
