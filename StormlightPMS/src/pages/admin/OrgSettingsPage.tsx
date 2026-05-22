import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Field } from '@/components/ui/Field';
import { useAuth } from '@/lib/auth';

interface OrgSettingsRow {
  org_id: string;
  rent_due_window_days: number;
  lease_expiry_thresholds: number[];
  reminder_email_enabled: boolean;
}

interface FormValues {
  rent_due_window_days: number;
  thresholds_csv: string;
  reminder_email_enabled: boolean;
}

export function OrgSettingsPage() {
  const { claims } = useAuth();
  const qc = useQueryClient();
  const orgId = claims.org_id;

  const { data, isLoading } = useQuery({
    queryKey: ['org-settings', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_settings')
        .select('*')
        .eq('org_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as OrgSettingsRow | null;
    },
  });

  const { register, handleSubmit, reset, formState } = useForm<FormValues>({
    defaultValues: {
      rent_due_window_days: 3,
      thresholds_csv: '60,30',
      reminder_email_enabled: true,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        rent_due_window_days: data.rent_due_window_days,
        thresholds_csv: data.lease_expiry_thresholds.join(','),
        reminder_email_enabled: data.reminder_email_enabled,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const parsed = values.thresholds_csv
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n) && n > 0);
      const { error } = await supabase
        .from('org_settings')
        .update({
          rent_due_window_days: values.rent_due_window_days,
          lease_expiry_thresholds: parsed,
          reminder_email_enabled: values.reminder_email_enabled,
        })
        .eq('org_id', orgId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-settings', orgId] }),
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="Organization settings" subtitle="Reminder windows and email behavior" />
      {isLoading ? (
        <div className="text-sm text-slate-500">Loading…</div>
      ) : (
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="card p-6 space-y-4"
        >
          <Field
            label="Rent-due reminder window (days)"
            htmlFor="s-window"
            hint="Notify when a charge becomes due within this many days"
          >
            <input
              id="s-window"
              type="number"
              min={0}
              className="input"
              {...register('rent_due_window_days', { valueAsNumber: true })}
            />
          </Field>
          <Field
            label="Lease-expiry thresholds (days, comma-separated)"
            htmlFor="s-thresholds"
            hint="Default: 60,30"
          >
            <input id="s-thresholds" className="input" {...register('thresholds_csv')} />
          </Field>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('reminder_email_enabled')} />
            Send reminder emails (in-app notifications always fire)
          </label>
          {mutation.error && (
            <div className="text-sm text-red-700">{(mutation.error as Error).message}</div>
          )}
          <div className="flex justify-end">
            <button type="submit" className="btn-primary" disabled={formState.isSubmitting}>
              Save settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
