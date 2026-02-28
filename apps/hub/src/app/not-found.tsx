import Link from "next/link";
import { FileQuestion, Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <FileQuestion className="w-8 h-8 text-gray-400" />
        </div>

        <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Page not found
        </h2>

        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go home
          </Link>

          <Link
            href="/containers"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse containers
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 text-left">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Looking for something specific?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <Link href="/explore" className="text-emerald-600 hover:underline">
                Explore containers
              </Link>
            </li>
            <li>
              <Link href="/trending" className="text-emerald-600 hover:underline">
                View trending
              </Link>
            </li>
            <li>
              <Link href="/docs" className="text-emerald-600 hover:underline">
                Read docs
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
