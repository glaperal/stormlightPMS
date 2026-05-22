// import-csv — transactional CSV import for properties / units / tenants / leases.
// SRS §6.13 / FR-IMP-1..3. Server-side because we need transactional semantics.
// deno-lint-ignore-file no-explicit-any
import {
  adminClient,
  corsHeaders,
  getCallerProfile,
  jsonResponse,
  requireMethod,
} from '../_shared/auth.ts';

type Entity = 'properties' | 'units' | 'tenants' | 'leases';

interface Payload {
  entity: Entity;
  rows: Record<string, string>[];
  org_id?: string;
}

Deno.serve(async (req) => {
  const m = requireMethod(req, 'POST');
  if (m) return m;
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const caller = await getCallerProfile(req);
    if (!caller) return jsonResponse(401, { error: 'unauthorized' });
    if (caller.role !== 'admin' && caller.role !== 'superadmin') {
      return jsonResponse(403, { error: 'forbidden' });
    }

    const body = (await req.json()) as Payload;
    const orgId =
      caller.role === 'superadmin' ? body.org_id : caller.org_id;
    if (!orgId) return jsonResponse(400, { error: 'missing_org_id' });
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return jsonResponse(400, { error: 'no_rows' });
    }

    const validated = validate(body.entity, body.rows, orgId);
    if (validated.errors.length > 0) {
      return jsonResponse(422, { ok: false, errors: validated.errors });
    }

    const admin = adminClient();
    const { error } = await admin.rpc('do_csv_import', {
      p_entity: body.entity,
      p_rows: validated.rows as any,
    });
    if (error) return jsonResponse(400, { ok: false, error: error.message });
    return jsonResponse(200, { ok: true, imported: validated.rows.length });
  } catch (e) {
    return jsonResponse(500, { error: (e as Error).message });
  }
});

function validate(
  entity: Entity,
  rows: Record<string, string>[],
  orgId: string,
): { rows: Record<string, unknown>[]; errors: { row: number; field?: string; message: string }[] } {
  const out: Record<string, unknown>[] = [];
  const errors: { row: number; field?: string; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (entity === 'properties') {
      if (!r.name) errors.push({ row: i + 1, field: 'name', message: 'required' });
      if (!r.property_type)
        errors.push({ row: i + 1, field: 'property_type', message: 'required' });
      out.push({
        org_id: orgId,
        name: r.name,
        property_type: r.property_type,
        region: r.region || null,
        province: r.province || null,
        city_municipality: r.city_municipality || null,
        barangay: r.barangay || null,
        street_address: r.street_address || null,
        postal_code: r.postal_code || null,
        description: r.description || null,
      });
    } else if (entity === 'units') {
      if (!r.property_id)
        errors.push({ row: i + 1, field: 'property_id', message: 'required' });
      if (!r.unit_label)
        errors.push({ row: i + 1, field: 'unit_label', message: 'required' });
      const rent = Number(r.base_monthly_rent);
      if (!Number.isFinite(rent) || rent < 0)
        errors.push({ row: i + 1, field: 'base_monthly_rent', message: 'must be ≥ 0' });
      out.push({
        org_id: orgId,
        property_id: r.property_id,
        unit_label: r.unit_label,
        floor: r.floor || null,
        bedrooms: r.bedrooms ? Number(r.bedrooms) : null,
        floor_area_sqm: r.floor_area_sqm ? Number(r.floor_area_sqm) : null,
        base_monthly_rent: rent,
      });
    } else if (entity === 'tenants') {
      if (!r.full_name)
        errors.push({ row: i + 1, field: 'full_name', message: 'required' });
      out.push({
        org_id: orgId,
        full_name: r.full_name,
        email: r.email || null,
        phone: r.phone || null,
        gov_id_type: r.gov_id_type || null,
        gov_id_number: r.gov_id_number || null,
        emergency_contact_name: r.emergency_contact_name || null,
        emergency_contact_phone: r.emergency_contact_phone || null,
      });
    } else if (entity === 'leases') {
      if (!r.unit_id) errors.push({ row: i + 1, field: 'unit_id', message: 'required' });
      if (!r.tenant_id)
        errors.push({ row: i + 1, field: 'tenant_id', message: 'required' });
      if (!r.start_date)
        errors.push({ row: i + 1, field: 'start_date', message: 'required' });
      if (!r.end_date)
        errors.push({ row: i + 1, field: 'end_date', message: 'required' });
      const rent = Number(r.monthly_rent);
      if (!Number.isFinite(rent) || rent <= 0)
        errors.push({ row: i + 1, field: 'monthly_rent', message: 'must be > 0' });
      out.push({
        org_id: orgId,
        unit_id: r.unit_id,
        tenant_id: r.tenant_id,
        start_date: r.start_date,
        end_date: r.end_date,
        monthly_rent: rent,
        payment_due_day: r.payment_due_day ? Number(r.payment_due_day) : 5,
        advance_months: r.advance_months ? Number(r.advance_months) : 1,
        advance_amount: r.advance_amount ? Number(r.advance_amount) : 0,
        security_deposit_months: r.security_deposit_months
          ? Number(r.security_deposit_months)
          : 2,
        security_deposit_amount: r.security_deposit_amount
          ? Number(r.security_deposit_amount)
          : 0,
      });
    } else {
      errors.push({ row: i + 1, message: `unsupported entity '${entity}'` });
    }
  }

  return { rows: out, errors };
}
