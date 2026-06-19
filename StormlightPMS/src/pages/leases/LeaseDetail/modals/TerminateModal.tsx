import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { manilaToday } from '@/lib/format';

export function TerminateModal({
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
        {error && <div className="text-sm text-danger-700">{error}</div>}
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
