import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Field } from '@/components/ui/Field';
import { buildSpecs, coerceSpec, specFieldsFor, type SpecsValue } from '@/lib/unitSpecs';

// D8 — optional asset-class `specs` editor, driven by the parent property's type.
export function UnitSpecsCard({
  unitId,
  propertyType,
  specs,
}: {
  unitId: string;
  propertyType: string | null | undefined;
  specs: SpecsValue | null | undefined;
}) {
  const qc = useQueryClient();
  const fields = specFieldsFor(propertyType);
  const [draft, setDraft] = useState<SpecsValue>(() => ({ ...(specs ?? {}) }));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const clean = buildSpecs(propertyType, draft);
      const { error: err } = await supabase.from('units').update({ specs: clean }).eq('id', unitId);
      if (err) throw err;
    },
    onSuccess: () => {
      setError(null);
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['unit', unitId] });
    },
    onError: (e) => setError((e as Error).message),
  });

  if (fields.length === 0) return null;

  return (
    <section className="card p-5 mb-6">
      <h2 className="text-base font-medium text-slate-900 mb-1">Asset specs</h2>
      <p className="text-xs text-slate-500 mb-4">
        Optional, asset-class-specific attributes for this {propertyType} unit.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fields.map((f) => {
          const id = `spec-${f.key}`;
          const value = draft[f.key];
          if (f.kind === 'boolean') {
            return (
              <Field key={f.key} label={f.label} htmlFor={id}>
                <select
                  id={id}
                  className="input"
                  value={value === true ? 'true' : value === false ? 'false' : ''}
                  onChange={(e) => {
                    setSaved(false);
                    setDraft((d) => ({ ...d, [f.key]: e.target.value === '' ? null : e.target.value === 'true' }));
                  }}
                >
                  <option value="">—</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </Field>
            );
          }
          return (
            <Field key={f.key} label={f.suffix ? `${f.label} (${f.suffix})` : f.label} htmlFor={id}>
              <input
                id={id}
                type={f.kind === 'number' ? 'number' : 'text'}
                step={f.kind === 'number' ? '0.01' : undefined}
                className="input"
                value={value == null ? '' : String(value)}
                onChange={(e) => {
                  setSaved(false);
                  setDraft((d) => ({ ...d, [f.key]: coerceSpec(f, e.target.value) }));
                }}
              />
            </Field>
          );
        })}
      </div>
      {error && <div className="mt-3 text-sm text-red-700">{error}</div>}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          className="btn-primary"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Saving…' : 'Save specs'}
        </button>
        {saved && <span className="text-sm text-emerald-700">Saved.</span>}
      </div>
    </section>
  );
}
