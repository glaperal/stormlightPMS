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
import { useAuth } from '@/lib/auth';

const TenantSchema = z.object({
  full_name: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gov_id_type: z.string().optional(),
  gov_id_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  notes: z.string().optional(),
});

type TenantFormValues = z.infer<typeof TenantSchema>;

interface TenantRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  status: string;
}

export function TenantsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data: rows, error: err } = await supabase
        .from('tenants')
        .select('id, full_name, email, phone, status')
        .order('full_name')
        .limit(500);
      if (err) throw err;
      return (rows ?? []) as TenantRow[];
    },
  });

  const filtered = (data ?? []).filter(
    (t) =>
      !filter ||
      t.full_name.toLowerCase().includes(filter.toLowerCase()) ||
      (t.email ?? '').toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Tenants"
        actions={
          <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
            New tenant
          </button>
        }
      />
      <div className="mb-3">
        <input
          className="input max-w-md"
          placeholder="Search by name or email"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {error && <div className="text-sm text-danger-700 mb-3">{(error as Error).message}</div>}
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No tenants" description="Add a tenant to begin creating leases." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">
                    <Link to={`/tenants/${t.id}`} className="text-fg-1 hover:underline">
                      {t.full_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{t.email ?? '—'}</td>
                  <td className="px-4 py-3">{t.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewTenantModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ['tenants'] })}
      />
    </div>
  );
}

function NewTenantModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { claims } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormValues>({ resolver: zodResolver(TenantSchema) });

  const mutation = useMutation({
    mutationFn: async (values: TenantFormValues) => {
      const orgId = claims.org_id;
      if (!orgId) throw new Error('No org context');
      const payload = {
        org_id: orgId,
        full_name: values.full_name,
        email: values.email || null,
        phone: values.phone || null,
        gov_id_type: values.gov_id_type || null,
        gov_id_number: values.gov_id_number || null,
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        notes: values.notes || null,
      };
      const { error } = await supabase.from('tenants').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      onClose();
      onCreated();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="New tenant" size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full name" htmlFor="t-name" error={errors.full_name?.message}>
            <input id="t-name" className="input" {...register('full_name')} />
          </Field>
          <Field label="Email" htmlFor="t-email" error={errors.email?.message}>
            <input id="t-email" type="email" className="input" {...register('email')} />
          </Field>
          <Field label="Phone" htmlFor="t-phone">
            <input id="t-phone" className="input" {...register('phone')} />
          </Field>
          <Field label="Government ID type" htmlFor="t-idtype">
            <input id="t-idtype" className="input" {...register('gov_id_type')} />
          </Field>
          <Field label="Government ID number" htmlFor="t-idnum">
            <input id="t-idnum" className="input" {...register('gov_id_number')} />
          </Field>
          <Field label="Emergency contact name" htmlFor="t-ecname">
            <input id="t-ecname" className="input" {...register('emergency_contact_name')} />
          </Field>
          <Field label="Emergency contact phone" htmlFor="t-ecphone">
            <input id="t-ecphone" className="input" {...register('emergency_contact_phone')} />
          </Field>
        </div>
        <Field label="Notes" htmlFor="t-notes">
          <textarea id="t-notes" rows={3} className="input" {...register('notes')} />
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
