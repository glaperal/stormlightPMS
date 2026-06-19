import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';

export function ReportsPage() {
  const links = [
    { to: '/reports/rent-roll', label: 'Rent roll' },
    { to: '/reports/arrears', label: 'Arrears aging' },
    { to: '/reports/collection', label: 'Collection summary' },
    { to: '/reports/property-income', label: 'Per-property income' },
  ];
  return (
    <div>
      <PageHeader title="Reports" subtitle="View and export operational reports" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="card p-5 hover:bg-subtle">
            <div className="text-base font-medium text-fg-1">{l.label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
