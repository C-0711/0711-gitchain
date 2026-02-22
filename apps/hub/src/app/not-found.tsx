import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-8xl mb-6">🔍</div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <h2 className="text-xl text-gray-400 mb-8">
          This is not the container you&apos;re looking for
        </h2>
        <p className="text-gray-500 mb-8 max-w-md">
          The page you requested could not be found. It may have been moved, deleted,
          or never existed in the first place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
          >
            Go Home
          </Link>
          <Link
            href="/containers"
            className="px-6 py-3 border border-gray-700 hover:border-gray-500 rounded-lg transition"
          >
            Browse Containers
          </Link>
        </div>
      </div>
    </div>
  );
}
