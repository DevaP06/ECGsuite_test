import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import logo from '../assets/ECGenius_logo.png';

export default function ErrorPage() {
  const error = useRouteError();

  let title = 'Unexpected Error';
  let description = 'An unexpected error occurred. Please try again or return to the dashboard.';
  let detail = '';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page Not Found';
      description = "The page you're looking for doesn't exist or has been moved.";
    } else if (error.status === 401 || error.status === 403) {
      title = 'Access Denied';
      description = "You don't have permission to view this page.";
    } else {
      title = `Error ${error.status}`;
      description = typeof error.data === 'string' ? error.data : description;
    }
  } else if (error instanceof Error) {
    detail = error.message;
  } else if (error && typeof error === 'object') {
    // Guard against the very bug we're fixing — never render the object directly
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string') detail = e.message;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
      {/* Brand header */}
      <div className="flex items-center gap-3 mb-12">
        <img src={logo} alt="ECGenius" className="w-9 h-9" />
        <span className="text-xl font-bold tracking-tight">ECGenius</span>
      </div>

      {/* Error icon */}
      <div className="w-16 h-16 rounded-full bg-red-950/60 flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      {/* Error details */}
      <h1 className="text-2xl font-bold text-white mb-3">{title}</h1>
      <p className="text-gray-400 text-sm max-w-sm text-center mb-4 leading-relaxed">
        {description}
      </p>

      {detail && (
        <pre className="text-xs text-gray-600 bg-gray-900/60 rounded-lg px-4 py-3 max-w-lg w-full text-center break-all whitespace-pre-wrap mb-6">
          {detail}
        </pre>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 justify-center">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-700 hover:bg-gray-800 text-sm font-semibold transition"
        >
          <Home className="w-4 h-4" />
          Home
        </Link>
      </div>

      <p className="mt-10 text-xs text-gray-600">
        If this keeps happening, contact support at{' '}
        <a href="mailto:ecgenius.life@gmail.com" className="text-blue-500 hover:underline">
          ecgenius.life@gmail.com
        </a>
      </p>
    </div>
  );
}
