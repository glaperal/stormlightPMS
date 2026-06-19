export function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase text-fg-3">{label}</dt>
      <dd className="mt-1 text-fg-1">{value}</dd>
    </div>
  );
}
