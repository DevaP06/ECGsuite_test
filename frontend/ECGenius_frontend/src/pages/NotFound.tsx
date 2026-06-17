import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
      <p className="text-8xl font-bold text-blue-500 mb-4">404</p>
      <h1 className="text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-gray-400 mb-8 text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
      >
        Go home
      </Link>
    </div>
  );
};

export default NotFound;
