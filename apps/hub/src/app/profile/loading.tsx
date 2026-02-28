/**
 * Loading state for profile page.
 */

import { UserProfileSkeleton, ContainerCardSkeleton, Skeleton } from "@/components/Skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile header */}
      <UserProfileSkeleton />

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mt-8 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-8 w-24" />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <ContainerCardSkeleton key={i} />
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contribution graph placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-24 w-full" />
          </div>

          {/* Organizations */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <Skeleton className="h-5 w-28 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-10 h-10 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
