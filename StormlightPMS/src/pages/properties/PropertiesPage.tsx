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
import { useAuth, hasRole } from '@/lib/auth';

const PropertySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  property_type: z.enum(['residential', 'commercial', 'mixed']),
  region: z.string().optional(),
  province: z.string().optional(),
  city_municipality: z.string().optional(),
  barangay: z.string().optional(),
  street_address: z.string().optional(),
  postal_code: z.string().optional(),
  description: z.string().optional(),
});

type PropertyFormValues = z.infer<typeof PropertySchema>;

interface PropertyRow {
  id: string;
  name: string;
  property_type: string;
  city_municipality: string | null;
  province: string | null;
  status: string;
}

export function PropertiesPage() {
  const { claims } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const { data: rows, error: err } = await supabase
        .from('properties')
        .select('id, name, property_type, city_municipality, province, status')
        .order('name', { ascending: true })
        .limit(200);
      if (err) throw err;
      return (rows ?? []) as PropertyRow[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Properties"
        subtitle="Buildings and standalone real-estate assets"
        actions={
          hasRole(claims, 'admin', 'superadmin') && (
            <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
              New property
            </button>
          )
        }
      />
      {error && <div className="text-sm text-danger-700 mb-3">{(error as Error).message}</div>}
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : (data ?? []).length === 0 ? (
        <EmptyState
          title="No properties yet"
          description="Create your first property to start managing units and leases."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-subtle text-fg-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data!.map((p) => (
                <tr key={p.id} className="table-row border-t border-subtle">
                  <td className="px-4 py-3">
                    <Link to={`/properties/${p.id}`} className="text-fg-1 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{p.property_type}</td>
                  <td className="px-4 py-3">
                    {[p.city_municipality, p.province].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewPropertyModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => qc.invalidateQueries({ queryKey: ['properties'] })}
      />
    </div>
  );
}

function NewPropertyModal({
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
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(PropertySchema),
    defaultValues: { property_type: 'residential' },
  });

  const mutation = useMutation({
    mutationFn: async (values: PropertyFormValues) => {
      const orgId = claims.org_id;
      if (!orgId) throw new Error('No org context');
      const { error } = await supabase.from('properties').insert({
        ...values,
        org_id: orgId,
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
    <Modal open={open} onClose={onClose} title="New property" size="lg">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Name" htmlFor="p-name" error={errors.name?.message}>
            <input id="p-name" className="input" {...register('name')} />
          </Field>
          <Field label="Type" htmlFor="p-type" error={errors.property_type?.message}>
            <select id="p-type" className="input" {...register('property_type')}>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="mixed">Mixed</option>
            </select>
          </Field>
          <Field label="Region" htmlFor="p-region">
            <input id="p-region" className="input" {...register('region')} />
          </Field>
          <Field label="Province" htmlFor="p-province">
            <input id="p-province" className="input" {...register('province')} />
          </Field>
          <Field label="City / Municipality" htmlFor="p-city">
            <input id="p-city" className="input" {...register('city_municipality')} />
          </Field>
          <Field label="Barangay" htmlFor="p-bgy">
            <input id="p-bgy" className="input" {...register('barangay')} />
          </Field>
          <Field label="Street address" htmlFor="p-street">
            <input id="p-street" className="input" {...register('street_address')} />
          </Field>
          <Field label="Postal code" htmlFor="p-zip">
            <input id="p-zip" className="input" {...register('postal_code')} />
          </Field>
        </div>
        <Field label="Description" htmlFor="p-desc">
          <textarea id="p-desc" rows={3} className="input" {...register('description')} />
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
