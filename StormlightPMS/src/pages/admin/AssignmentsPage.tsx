import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Field } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAuth } from '@/lib/auth';

interface PM {
  id: string;
  full_name: string;
}

interface Property {
  id: string;
  name: string;
}

interface AssignmentRow {
  id: string;
  profile_id: string;
  property_id: string;
  profiles: { full_name: string } | null;
  properties: { name: string } | null;
}

export function AssignmentsPage() {
  const qc = useQueryClient();
  const { claims } = useAuth();
  const [pm, setPm] = useState('');
  const [property, setProperty] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pms = useQuery({
    queryKey: ['pms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'property_manager')
        .eq('status', 'active')
        .order('full_name');
      if (error) throw error;
      return (data ?? []) as PM[];
    },
  });

  const properties = useQuery({
    queryKey: ['admin-properties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return (data ?? []) as Property[];
    },
  });

  const assignments = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_assignments')
        .select('id, profile_id, property_id, profiles(full_name), properties(name)')
        .order('id');
      if (error) throw error;
      return (data ?? []) as unknown as AssignmentRow[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!pm || !property) throw new Error('Pick a property manager and a property');
      const { error: err } = await supabase.from('property_assignments').insert({
        org_id: claims.org_id!,
        profile_id: pm,
        property_id: property,
      });
      if (err) throw err;
    },
    onSuccess: () => {
      setPm('');
      setProperty('');
      setError(null);
      qc.invalidateQueries({ queryKey: ['assignments'] });
    },
    onError: (e) => setError((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: err } = await supabase.from('property_assignments').delete().eq('id', id);
      if (err) throw err;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assignments'] }),
  });

  return (
    <div>
      <PageHeader title="Property assignments" subtitle="Assign property managers to properties" />
      <div className="card p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <Field label="Property manager" htmlFor="a-pm">
          <select id="a-pm" className="input" value={pm} onChange={(e) => setPm(e.target.value)}>
            <option value="">— select PM —</option>
            {(pms.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Property" htmlFor="a-prop">
          <select id="a-prop" className="input" value={property} onChange={(e) => setProperty(e.target.value)}>
            <option value="">— select property —</option>
            {(properties.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="button" className="btn-primary" onClick={() => create.mutate()}>
          Assign
        </button>
      </div>
      {error && <div className="text-sm text-red-700 mb-3">{error}</div>}
      {(assignments.data ?? []).length === 0 ? (
        <EmptyState title="No assignments yet" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Property manager</th>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {assignments.data!.map((a) => (
                <tr key={a.id} className="table-row border-t border-slate-100">
                  <td className="px-4 py-3">{a.profiles?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">{a.properties?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs text-red-700 hover:underline"
                      onClick={() => remove.mutate(a.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
