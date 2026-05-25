import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { manilaToday } from '@/lib/format';

const PaymentSchema = z.object({
  payment_date: z.string().min(1, 'Required'),
  amount: z.coerce.number().positive('> 0'),
  payment_method: z.enum(['cash', 'bank_transfer', 'gcash', 'maya', 'check', 'other']),
  reference_no: z.string().optional(),
  notes: z.string().optional(),
});
type PaymentFormValues = z.infer<typeof PaymentSchema>;

export function NewPaymentModal({
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
