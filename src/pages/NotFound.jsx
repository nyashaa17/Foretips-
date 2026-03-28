import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-red-100 mb-8">
            <AlertCircle className="h-12 w-12 text-red-600" aria-hidden="true" />
          </div>
          <h2 className="mt-6 text-4xl font-extrabold text-slate-900 tracking-tight">
            404
          </h2>
          <h3 className="mt-2 text-2xl font-bold text-slate-800">
            Page not found
          </h3>
          <p className="mt-4 text-base text-slate-500">
            Sorry, we couldn't find the page you're looking for. The link you followed might be broken, or the page may have been removed.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
