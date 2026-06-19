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
import { invokeFunction } from '@/lib/functions';

const OrgSchema = z.object({
  name: z.string().min(1, 'Required'),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
});

type OrgFormValues = z.infer<typeof OrgSchema>;

interface OrgRow {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  contact_email: string | null;
  contact_phone: string | null;
}

export function OrganizationsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['orgs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, status, contact_email, contact_phone')
        .order('name');
      if (error) throw error;
      return (data ?? []) as OrgRow[];
    },
  });

  const setSuspended = useMutation({
    mutationFn: async (args: { org_id: string; suspended: boolean }) => {
      const res = await invokeFunction('set-org-suspended', args);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orgs'] }),
  });

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle="Tenants of the StormlightPMS platform"
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            New organization
          </button>
        }
      />
      {setSuspended.error && (
        <div className="text-sm text-danger-700 mb-3">{(setSuspended.error as Error).message}</div>
      )}
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState title="No organizations" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {data!.map((o) => (
                <tr key={o.id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">{o.name}</td>
                  <td className="px-4 py-3">
                    {[o.contact_email, o.contact_phone].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={o.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-fg-2 hover:underline"
                      onClick={() =>
                        setSuspended.mutate({ org_id: o.id, suspended: o.status !== 'suspended' })
                      }
                    >
                      {o.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <NewOrgModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ['orgs'] })}
      />
    </div>
  );
}

function NewOrgModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrgFormValues>({ resolver: zodResolver(OrgSchema) });
  const mutation = useMutation({
    mutationFn: async (values: OrgFormValues) => {
      const { error } = await supabase.from('organizations').insert({
        name: values.name,
        contact_email: values.contact_email || null,
        contact_phone: values.contact_phone || null,
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
    <Modal open={open} onClose={onClose} title="New organization">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Name" htmlFor="o-name" error={errors.name?.message}>
          <input id="o-name" className="input" {...register('name')} />
        </Field>
        <Field label="Contact email" htmlFor="o-email" error={errors.contact_email?.message}>
          <input id="o-email" type="email" className="input" {...register('contact_email')} />
        </Field>
        <Field label="Contact phone" htmlFor="o-phone">
          <input id="o-phone" className="input" {...register('contact_phone')} />
        </Field>
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
