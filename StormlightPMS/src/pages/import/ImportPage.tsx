import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/PageHeader';
import { Field } from '@/components/ui/Field';
import { parseCsv, exportCsv } from '@/lib/csv';
import { useAuth } from '@/lib/auth';
import { invokeFunction } from '@/lib/functions';

type Entity = 'properties' | 'units' | 'tenants' | 'leases';

const TEMPLATES: Record<Entity, { columns: string[]; example: Record<string, string> }> = {
  properties: {
    columns: [
      'name',
      'property_type',
      'region',
      'province',
      'city_municipality',
      'barangay',
      'street_address',
      'postal_code',
      'description',
    ],
    example: {
      name: 'Sample House',
      property_type: 'residential',
      region: 'NCR',
      province: 'Metro Manila',
      city_municipality: 'Makati',
      barangay: 'Bel-Air',
      street_address: '123 Ayala Ave',
      postal_code: '1209',
      description: '',
    },
  },
  units: {
    columns: [
      'property_id',
      'unit_label',
      'floor',
      'bedrooms',
      'floor_area_sqm',
      'base_monthly_rent',
    ],
    example: {
      property_id: '00000000-0000-0000-0000-000000000000',
      unit_label: 'A-101',
      floor: '1',
      bedrooms: '2',
      floor_area_sqm: '45.50',
      base_monthly_rent: '25000',
    },
  },
  tenants: {
    columns: [
      'full_name',
      'email',
      'phone',
      'gov_id_type',
      'gov_id_number',
      'emergency_contact_name',
      'emergency_contact_phone',
    ],
    example: {
      full_name: 'Juan Dela Cruz',
      email: 'juan@example.com',
      phone: '09171234567',
      gov_id_type: 'PhilID',
      gov_id_number: '1234-5678-9012',
      emergency_contact_name: 'Maria Dela Cruz',
      emergency_contact_phone: '09181234567',
    },
  },
  leases: {
    columns: [
      'unit_id',
      'tenant_id',
      'start_date',
      'end_date',
      'monthly_rent',
      'payment_due_day',
      'advance_months',
      'advance_amount',
      'security_deposit_months',
      'security_deposit_amount',
    ],
    example: {
      unit_id: '00000000-0000-0000-0000-000000000000',
      tenant_id: '00000000-0000-0000-0000-000000000000',
      start_date: '2026-06-01',
      end_date: '2027-05-31',
      monthly_rent: '25000',
      payment_due_day: '5',
      advance_months: '1',
      advance_amount: '25000',
      security_deposit_months: '2',
      security_deposit_amount: '50000',
    },
  },
};

interface OrgOption {
  id: string;
  name: string;
}

export function ImportPage() {
  const { claims } = useAuth();
  const [entity, setEntity] = useState<Entity>('properties');
  const [orgId, setOrgId] = useState<string>('');
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<{ row: number; field?: string; message: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  const orgs = useQuery({
    queryKey: ['import-orgs'],
    enabled: claims.role === 'superadmin',
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('id, name').order('name');
      if (error) throw error;
      return (data ?? []) as OrgOption[];
    },
  });

  function downloadTemplate() {
    const t = TEMPLATES[entity];
    exportCsv(`${entity}_template.csv`, [t.example]);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setResultMsg(null);
    setErrors([]);
    const f = e.target.files?.[0];
    if (!f) return;
    const parsed = await parseCsv<Record<string, string>>(f);
    setRows(parsed.rows);
  }

  async function onImport() {
    setBusy(true);
    setErrors([]);
    setResultMsg(null);
    const targetOrg = claims.role === 'superadmin' ? orgId : claims.org_id ?? '';
    if (!targetOrg) {
      setBusy(false);
      setErrors([{ row: 0, message: 'No organization selected' }]);
      return;
    }
    const res = await invokeFunction<{ ok: boolean; imported?: number; errors?: typeof errors }>(
      'import-csv',
      { entity, rows, org_id: targetOrg },
    );
    setBusy(false);
    if (res.error) {
      setErrors([{ row: 0, message: res.error }]);
      return;
    }
    const body = res.data;
    if (body && body.ok === false && body.errors) {
      setErrors(body.errors);
      return;
    }
    setResultMsg(`Imported ${body?.imported ?? rows.length} ${entity}.`);
    setRows([]);
  }

  return (
    <div>
      <PageHeader title="CSV import" subtitle="Properties, units, tenants, leases (transactional per file)" />
      <div className="card p-5 mb-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Entity" htmlFor="imp-entity">
            <select
              id="imp-entity"
              className="input"
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value as Entity);
                setRows([]);
                setErrors([]);
                setResultMsg(null);
              }}
            >
              <option value="properties">Properties</option>
              <option value="units">Units</option>
              <option value="tenants">Tenants</option>
              <option value="leases">Leases</option>
            </select>
          </Field>
          {claims.role === 'superadmin' && (
            <Field label="Organization" htmlFor="imp-org">
              <select
                id="imp-org"
                className="input"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
              >
                <option value="">— select —</option>
                {(orgs.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <div className="flex items-end">
            <button type="button" className="btn-secondary w-full" onClick={downloadTemplate}>
              Download template
            </button>
          </div>
        </div>
        <div>
          <label className="label">CSV file</label>
          <input type="file" accept=".csv" onChange={onFile} />
        </div>
        <div className="text-xs text-slate-500">
          Required columns: {TEMPLATES[entity].columns.join(', ')}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card p-5 mb-4">
          <div className="text-sm text-slate-700 mb-3">
            {rows.length} rows ready to import. The whole file commits as one transaction.
          </div>
          <div className="overflow-auto max-h-72 border border-slate-200 rounded">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 text-left">
                <tr>
                  {TEMPLATES[entity].columns.map((c) => (
                    <th key={c} className="px-2 py-1 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 100).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {TEMPLATES[entity].columns.map((c) => (
                      <td key={c} className="px-2 py-1">
                        {r[c] ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setRows([]);
                setErrors([]);
                setResultMsg(null);
              }}
            >
              Clear
            </button>
            <button type="button" className="btn-primary" onClick={onImport} disabled={busy}>
              {busy ? 'Importing…' : `Import ${rows.length} rows`}
            </button>
          </div>
        </div>
      )}

      {resultMsg && <div className="card p-4 text-sm text-emerald-800 bg-emerald-50 border-emerald-200">{resultMsg}</div>}

      {errors.length > 0 && (
        <div className="card p-4 text-sm text-rose-800 bg-rose-50 border-rose-200">
          <div className="font-medium mb-1">{errors.length} error(s) — nothing was imported.</div>
          <ul className="list-disc pl-5 space-y-1">
            {errors.slice(0, 20).map((e, i) => (
              <li key={i}>
                Row {e.row}
                {e.field ? `, field "${e.field}"` : ''}: {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
