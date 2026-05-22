export interface PHAddress {
  region: string | null;
  province: string | null;
  city_municipality: string | null;
  barangay: string | null;
  street_address: string | null;
  postal_code: string | null;
}

export function formatPHAddress(a: PHAddress): string {
  return [a.street_address, a.barangay, a.city_municipality, a.province, a.region, a.postal_code]
    .filter(Boolean)
    .join(', ');
}
