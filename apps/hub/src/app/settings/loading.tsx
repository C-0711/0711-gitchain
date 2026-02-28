/**
 * Loading state for settings pages.
 */

import { SidebarSkeleton, Skeleton } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-gray-200">
            <SidebarSkeleton />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-6">
              {/* Form field skeletons */}
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
              <Skeleton className="h-10 w-32 mt-4" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
