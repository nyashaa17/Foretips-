import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-4">
      <ol className="flex items-center space-x-2 text-sm text-slate-500">
        <li>
          <Link to="/" className="hover:text-green-600 flex items-center">
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="w-4 h-4 mx-1" />
              {last ? (
                <span className="text-slate-900 font-medium capitalize" aria-current="page">
                  {value.replace(/-/g, ' ')}
                </span>
              ) : (
                <Link to={to} className="hover:text-green-600 capitalize">
                  {value.replace(/-/g, ' ')}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
