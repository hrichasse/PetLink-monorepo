import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }).map((_, i) => <Skeleton key={i} className="h-48 rounded-card" />)}</div>;
}
