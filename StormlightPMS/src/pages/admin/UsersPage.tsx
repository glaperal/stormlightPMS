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
import { useAuth } from '@/lib/auth';
import { invokeFunction } from '@/lib/functions';

const InviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1, 'Required'),
  role: z.enum(['admin', 'property_manager']),
  org_id: z.string().uuid().optional(),
});

type InviteFormValues = z.infer<typeof InviteSchema>;

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'property_manager';
  status: 'active' | 'inactive';
  org_id: string | null;
}

interface OrgOption {
  id: string;
  name: string;
}

export function UsersPage() {
  const qc = useQueryClient();
  const { claims } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);

  const users = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, status, org_id')
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as UserRow[];
    },
  });

  const orgs = useQuery({
    queryKey: ['orgs-options'],
    enabled: claims.role === 'superadmin',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (data ?? []) as OrgOption[];
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (args: { profile_id: string; status: 'active' | 'inactive' }) => {
      const res = await invokeFunction('set-profile-status', args);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        actions={
          <button type="button" className="btn-primary" onClick={() => setInviteOpen(true)}>
            Invite user
          </button>
        }
      />
      {toggleStatus.error && (
        <div className="text-sm text-danger-700 mb-3">{(toggleStatus.error as Error).message}</div>
      )}
      {users.isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (users.data ?? []).length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.data!.map((u) => (
                <tr key={u.id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={u.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.role === 'property_manager' &&
                      (claims.role === 'admin' || claims.role === 'superadmin') && (
                        <button
                          type="button"
                          className="text-xs text-fg-2 hover:underline"
                          onClick={() =>
                            toggleStatus.mutate({
                              profile_id: u.id,
                              status: u.status === 'active' ? 'inactive' : 'active',
                            })
                          }
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        orgs={orgs.data ?? []}
        onSent={() => qc.invalidateQueries({ queryKey: ['users'] })}
      />
    </div>
  );
}

function InviteModal({
  open,
  onClose,
  orgs,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  orgs: OrgOption[];
  onSent: () => void;
}) {
  const { claims } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(InviteSchema),
    defaultValues: { role: claims.role === 'superadmin' ? 'admin' : 'property_manager' },
  });

  const mutation = useMutation({
    mutationFn: async (values: InviteFormValues) => {
      const orgId = claims.role === 'superadmin' ? values.org_id! : claims.org_id!;
      if (!orgId) throw new Error('No org selected');
      const res = await invokeFunction('invite-user', {
        email: values.email,
        full_name: values.full_name,
        role: values.role,
        org_id: orgId,
      });
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      reset();
      onClose();
      onSent();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Invite user">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <Field label="Full name" htmlFor="i-name" error={errors.full_name?.message}>
          <input id="i-name" className="input" {...register('full_name')} />
        </Field>
        <Field label="Email" htmlFor="i-email" error={errors.email?.message}>
          <input id="i-email" type="email" className="input" {...register('email')} />
        </Field>
        <Field label="Role" htmlFor="i-role">
          <select id="i-role" className="input" {...register('role')}>
            {claims.role === 'superadmin' && <option value="admin">Admin</option>}
            <option value="property_manager">Property Manager</option>
          </select>
        </Field>
        {claims.role === 'superadmin' && (
          <Field label="Organization" htmlFor="i-org" error={errors.org_id?.message}>
            <select id="i-org" className="input" {...register('org_id')}>
              <option value="">— select organization —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {mutation.error && (
          <div className="text-sm text-danger-700">{(mutation.error as Error).message}</div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending…' : 'Send invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
