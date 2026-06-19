import { useState } from 'react';
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

const Schema = z.object({
  unit_id: z.string().uuid('Select a unit'),
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  reported_date: z.string().min(1, 'Required'),
});
type FormValues = z.infer<typeof Schema>;

interface Request {
  id: string;
  org_id: string;
  unit_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  reported_date: string;
  resolved_date: string | null;
  cost: string | null;
  assigned_to: string | null;
  units: { unit_label: string; properties: { name: string } | null } | null;
}

interface UnitOption {
  id: string;
  unit_label: string;
  org_id: string;
  properties: { name: string } | null;
}

export function MaintenancePage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const requests = useQuery({
    queryKey: ['maintenance', statusFilter],
    queryFn: async () => {
      let q = supabase
        .from('maintenance_requests')
        .select(
          'id, org_id, unit_id, title, description, priority, status, reported_date, resolved_date, cost, assigned_to, units(unit_label, properties(name))',
        )
        .order('reported_date', { ascending: false });
      if (statusFilter !== 'all') q = q.eq('status', statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Request[];
    },
  });

  const units = useQuery({
    queryKey: ['units-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_label, org_id, properties(name)')
        .order('unit_label');
      if (error) throw error;
      return (data ?? []) as unknown as UnitOption[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Maintenance"
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            New request
          </button>
        }
      />
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-fg-2">Status</label>
        <select
          className="input max-w-xs"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {(requests.data ?? []).length === 0 ? (
        <EmptyState title="No maintenance requests" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Reported</th>
                <th className="px-4 py-3 font-medium">Property · Unit</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Cost</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {requests.data!.map((r) => (
                <RequestRow
                  key={r.id}
                  row={r}
                  onChanged={() => qc.invalidateQueries({ queryKey: ['maintenance', statusFilter] })}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewRequestModal
        open={open}
        onClose={() => setOpen(false)}
        units={units.data ?? []}
        onCreated={() => qc.invalidateQueries({ queryKey: ['maintenance', statusFilter] })}
      />
    </div>
  );
}

function RequestRow({ row, onChanged }: { row: Request; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <tr className="table-row border-t border-subtle">
        <td className="px-4 py-3">{fmtDate(row.reported_date)}</td>
        <td className="px-4 py-3">
          {row.units?.properties?.name ?? '—'} · {row.units?.unit_label ?? '—'}
        </td>
        <td className="px-4 py-3">{row.title}</td>
        <td className="px-4 py-3">
          <StatusBadge value={row.priority} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge value={row.status} />
        </td>
        <td className="px-4 py-3">{row.cost ? fmtPHP(row.cost) : '—'}</td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            className="text-xs text-fg-2 hover:underline focus:outline-none focus:ring-2 focus:ring-accent rounded px-1"
            aria-label={`Edit maintenance request: ${row.title}`}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </td>
      </tr>
      <EditRequestModal
        open={editing}
        onClose={() => setEditing(false)}
        row={row}
        onChanged={() => {
          setEditing(false);
          onChanged();
        }}
      />
    </>
  );
}

function NewRequestModal({
  open,
  onClose,
  units,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  units: UnitOption[];
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
    defaultValues: { priority: 'medium', reported_date: manilaToday() },
  });
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const unit = units.find((u) => u.id === values.unit_id);
      const orgId = unit?.org_id ?? claims.org_id;
      if (!orgId) throw new Error('No org context');
      const { error } = await supabase.from('maintenance_requests').insert({
        org_id: orgId,
        unit_id: values.unit_id,
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        reported_date: values.reported_date,
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
    <Modal open={open} onClose={onClose} title="New maintenance request">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Unit" htmlFor="m-unit" error={errors.unit_id?.message}>
          <select id="m-unit" className="input" {...register('unit_id')}>
            <option value="">— select unit —</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.properties?.name ?? '—'} · {u.unit_label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title" htmlFor="m-title" error={errors.title?.message}>
          <input id="m-title" className="input" {...register('title')} />
        </Field>
        <Field label="Description" htmlFor="m-desc">
          <textarea id="m-desc" rows={3} className="input" {...register('description')} />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Priority" htmlFor="m-prio">
            <select id="m-prio" className="input" {...register('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
          <Field label="Reported date" htmlFor="m-date" error={errors.reported_date?.message}>
            <input id="m-date" type="date" className="input" {...register('reported_date')} />
          </Field>
        </div>
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

function EditRequestModal({
  open,
  onClose,
  row,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  row: Request;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState(row.status);
  const [assignedTo, setAssignedTo] = useState(row.assigned_to ?? '');
  const [cost, setCost] = useState(row.cost ?? '');
  const [resolved, setResolved] = useState(row.resolved_date ?? '');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (status === 'completed' && !resolved) {
        throw new Error('Resolved date is required when status is completed');
      }
      const { error: err } = await supabase
        .from('maintenance_requests')
        .update({
          status,
          assigned_to: assignedTo || null,
          cost: cost ? Number(cost) : null,
          resolved_date: resolved || null,
        })
        .eq('id', row.id);
      if (err) throw err;
    },
    onSuccess: onChanged,
    onError: (e) => setError((e as Error).message),
  });

  return (
    <Modal open={open} onClose={onClose} title={`Update: ${row.title}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Status" htmlFor="e-status">
            <select
              id="e-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as Request['status'])}
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </Field>
          <Field label="Resolved date" htmlFor="e-resolved">
            <input
              id="e-resolved"
              type="date"
              className="input"
              value={resolved}
              onChange={(e) => setResolved(e.target.value)}
            />
          </Field>
          <Field label="Assigned to" htmlFor="e-assignee">
            <input
              id="e-assignee"
              className="input"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            />
          </Field>
          <Field label="Cost (₱)" htmlFor="e-cost">
            <input
              id="e-cost"
              type="number"
              step="0.01"
              min={0}
              className="input"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </Field>
        </div>
        {error && <div className="text-sm text-danger-700">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
