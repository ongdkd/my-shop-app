import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go Home
          </Link>
          
          <div className="text-sm text-gray-500">
            <Link href="/pos" className="text-blue-600 hover:underline">
              POS Terminals
            </Link>
            {" • "}
            <Link href="/admin" className="text-blue-600 hover:underline">
              Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}