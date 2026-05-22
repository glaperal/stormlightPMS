import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
import { fmtPHP } from '@/lib/format';
import { useAuth, hasRole } from '@/lib/auth';

interface Property {
  id: string;
  org_id: string;
  name: string;
  property_type: string;
  region: string | null;
  province: string | null;
  city_municipality: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: string | null;
  description: string | null;
  status: 'active' | 'archived';
}

interface Unit {
  id: string;
  unit_label: string;
  floor: string | null;
  bedrooms: number | null;
  base_monthly_rent: string;
  unit_status: string;
}

const UnitSchema = z.object({
  unit_label: z.string().min(1, 'Required'),
  floor: z.string().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  floor_area_sqm: z.coerce.number().min(0).optional(),
  base_monthly_rent: z.coerce.number().min(0, 'Must be ≥ 0'),
  notes: z.string().optional(),
});

type UnitFormValues = z.infer<typeof UnitSchema>;

export function PropertyDetailPage() {
  const { propertyId } = useParams();
  const qc = useQueryClient();
  const { claims } = useAuth();
  const [unitOpen, setUnitOpen] = useState(false);

  const property = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId!)
        .maybeSingle();
      if (error) throw error;
      return data as Property | null;
    },
    enabled: !!propertyId,
  });

  const units = useQuery({
    queryKey: ['property-units', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, unit_label, floor, bedrooms, base_monthly_rent, unit_status')
        .eq('property_id', propertyId!)
        .order('unit_label');
      if (error) throw error;
      return (data ?? []) as Unit[];
    },
    enabled: !!propertyId,
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const next = property.data?.status === 'archived' ? 'active' : 'archived';
      const { error } = await supabase
        .from('properties')
        .update({ status: next })
        .eq('id', propertyId!);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['property', propertyId] }),
  });

  if (property.isLoading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (!property.data) return <EmptyState title="Property not found" />;

  const p = property.data;

  return (
    <div>
      <PageHeader
        title={p.name}
        subtitle={[p.city_municipality, p.province].filter(Boolean).join(', ')}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge value={p.status} />
            {hasRole(claims, 'admin', 'superadmin') && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => archiveMutation.mutate()}
              >
                {p.status === 'archived' ? 'Unarchive' : 'Archive'}
              </button>
            )}
            {hasRole(claims, 'admin', 'superadmin', 'property_manager') && (
              <button type="button" className="btn-primary" onClick={() => setUnitOpen(true)}>
                Add unit
              </button>
            )}
          </div>
        }
      />

      <section className="card p-5 mb-6">
        <h2 className="text-base font-medium text-slate-900 mb-3">Property details</h2>
        <dl className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <Detail label="Type" value={p.property_type} />
          <Detail
            label="Address"
            value={
              [p.street_address, p.barangay, p.city_municipality, p.province, p.region, p.postal_code]
                .filter(Boolean)
                .join(', ') || '—'
            }
          />
          <Detail label="Description" value={p.description || '—'} />
        </dl>
      </section>

      <section>
        <h2 className="text-base font-medium text-slate-900 mb-3">Units</h2>
        {units.isLoading ? (
          <div className="text-sm text-slate-500">Loading units…</div>
        ) : (units.data ?? []).length === 0 ? (
          <EmptyState
            title="No units yet"
            description="Add at least one unit; a standalone house is a property with one unit."
          />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">Floor</th>
                  <th className="px-4 py-3 font-medium">Bedrooms</th>
                  <th className="px-4 py-3 font-medium">Base rent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {units.data!.map((u) => (
                  <tr key={u.id} className="table-row border-t border-slate-100">
                    <td className="px-4 py-3">
                      <Link to={`/units/${u.id}`} className="text-slate-900 hover:underline">
                        {u.unit_label}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{u.floor ?? '—'}</td>
                    <td className="px-4 py-3">{u.bedrooms ?? '—'}</td>
                    <td className="px-4 py-3">{fmtPHP(u.base_monthly_rent)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge value={u.unit_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <NewUnitModal
        open={unitOpen}
        onClose={() => setUnitOpen(false)}
        propertyId={propertyId!}
        orgId={p.org_id}
        onCreated={() => qc.invalidateQueries({ queryKey: ['property-units', propertyId] })}
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}

function NewUnitModal({
  open,
  onClose,
  propertyId,
  orgId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  orgId: string;
  onCreated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(UnitSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: UnitFormValues) => {
      const payload = {
        org_id: orgId,
        property_id: propertyId,
        unit_label: values.unit_label,
        floor: values.floor || null,
        bedrooms: values.bedrooms ?? null,
        floor_area_sqm: values.floor_area_sqm ?? null,
        base_monthly_rent: values.base_monthly_rent,
        notes: values.notes || null,
      };
      const { error } = await supabase.from('units').insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      reset();
      onClose();
      onCreated();
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add unit">
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Unit label" htmlFor="u-label" error={errors.unit_label?.message}>
            <input id="u-label" className="input" {...register('unit_label')} />
          </Field>
          <Field label="Floor" htmlFor="u-floor">
            <input id="u-floor" className="input" {...register('floor')} />
          </Field>
          <Field label="Bedrooms" htmlFor="u-beds">
            <input id="u-beds" type="number" min={0} className="input" {...register('bedrooms')} />
          </Field>
          <Field label="Floor area (sqm)" htmlFor="u-sqm">
            <input
              id="u-sqm"
              type="number"
              step="0.01"
              min={0}
              className="input"
              {...register('floor_area_sqm')}
            />
          </Field>
          <Field
            label="Base monthly rent (₱)"
            htmlFor="u-rent"
            error={errors.base_monthly_rent?.message}
          >
            <input
              id="u-rent"
              type="number"
              step="0.01"
              min={0}
              className="input"
              {...register('base_monthly_rent')}
            />
          </Field>
        </div>
        <Field label="Notes" htmlFor="u-notes">
          <textarea id="u-notes" rows={3} className="input" {...register('notes')} />
        </Field>
        {mutation.error && (
          <div className="text-sm text-red-700">{(mutation.error as Error).message}</div>
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Create unit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
