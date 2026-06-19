import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { manilaToday } from '@/lib/format';

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

export function NewChargeModal({
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(ChargeSchema),
    defaultValues: { charge_type: 'rent', due_date: manilaToday() },
  });

  // OR-7 (soft, non-blocking): warn if a non-void charge of the same type already
  // exists for this lease + billing period, so a duplicate isn't created by accident.
  const watchedType = watch('charge_type');
  const watchedPeriod = watch('billing_period');
  const dupCheck = useQuery({
    queryKey: ['charge-dup', leaseId, watchedType, watchedPeriod],
    enabled: open && !!watchedPeriod,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('charges')
        .select('id', { count: 'exact', head: true })
        .eq('lease_id', leaseId)
        .eq('charge_type', watchedType)
        .eq('billing_period', watchedPeriod as string)
        .neq('charge_status', 'void');
      if (error) throw error;
      return count ?? 0;
    },
  });
  const isDuplicate = (dupCheck.data ?? 0) > 0;
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
        {isDuplicate && (
          <div className="rounded-md border border bg-warning-50 px-3 py-2 text-sm text-warning-fg">
            A non-void {watchedType.replace(/_/g, ' ')} charge already exists for this lease and
            billing period. You can still proceed if this is intentional.
          </div>
        )}
        {mutation.error && (
          <div className="text-sm text-danger-700">{(mutation.error as Error).message}</div>
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
