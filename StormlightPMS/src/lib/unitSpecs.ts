// D8 — optional polymorphic unit `specs` (SRS §4.6).
// An app-side field registry keyed on the parent property's `property_type`.
// The DB stores the resulting JSON in `units.specs` with no per-key constraints;
// this module is the single source of truth for which keys are offered and how
// they validate. No reporting or RLS logic depends on specs.
import { z } from 'zod';

export type PropertyType = 'residential' | 'commercial' | 'mixed';

export interface SpecField {
  key: string;
  label: string;
  kind: 'number' | 'text' | 'boolean';
  /** Optional unit suffix shown next to the label, e.g. "m", "kg/m²". */
  suffix?: string;
}

const RESIDENTIAL: SpecField[] = [
  { key: 'balcony_sqm', label: 'Balcony area', kind: 'number', suffix: 'm²' },
  { key: 'parking_slots', label: 'Parking slots', kind: 'number' },
  { key: 'furnished', label: 'Furnished', kind: 'boolean' },
  { key: 'pet_friendly', label: 'Pet friendly', kind: 'boolean' },
];

const COMMERCIAL: SpecField[] = [
  { key: 'ceiling_height_m', label: 'Ceiling height', kind: 'number', suffix: 'm' },
  { key: 'floor_load_kg_sqm', label: 'Floor load capacity', kind: 'number', suffix: 'kg/m²' },
  { key: 'loading_docks', label: 'Loading docks', kind: 'number' },
  { key: 'three_phase_power', label: '3-phase power', kind: 'boolean' },
];

// Mixed-use units may carry either set; offer the union.
const MIXED: SpecField[] = [...RESIDENTIAL, ...COMMERCIAL];

export const SPEC_FIELDS: Record<PropertyType, SpecField[]> = {
  residential: RESIDENTIAL,
  commercial: COMMERCIAL,
  mixed: MIXED,
};

export function specFieldsFor(propertyType: string | null | undefined): SpecField[] {
  if (propertyType && propertyType in SPEC_FIELDS) {
    return SPEC_FIELDS[propertyType as PropertyType];
  }
  return [];
}

/** A Zod schema for the specs of a given property type — every field optional. */
export function specsSchemaFor(propertyType: string | null | undefined): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of specFieldsFor(propertyType)) {
    if (f.kind === 'number') shape[f.key] = z.number().nonnegative().optional();
    else if (f.kind === 'boolean') shape[f.key] = z.boolean().optional();
    else shape[f.key] = z.string().optional();
  }
  return z.object(shape).strip();
}

export type SpecsValue = Record<string, string | number | boolean | null>;

/** Coerce a raw form/record value into the typed value for a field, or null. */
export function coerceSpec(field: SpecField, raw: unknown): string | number | boolean | null {
  if (raw === '' || raw === undefined || raw === null) return null;
  if (field.kind === 'number') {
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  if (field.kind === 'boolean') return raw === true || raw === 'true';
  return String(raw);
}

/** Build a clean specs object (dropping empty values) from a form record. */
export function buildSpecs(propertyType: string | null | undefined, form: SpecsValue): SpecsValue {
  const out: SpecsValue = {};
  for (const f of specFieldsFor(propertyType)) {
    const v = coerceSpec(f, form[f.key]);
    if (v !== null && v !== false && v !== '') out[f.key] = v;
  }
  return out;
}
