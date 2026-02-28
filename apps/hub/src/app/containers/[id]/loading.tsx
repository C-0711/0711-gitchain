/**
 * Loading state for container detail page.
 */

import { ContainerDetailSkeleton } from "@/components/Skeleton";

export default function ContainerDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ContainerDetailSkeleton />
    </div>
  );
}
