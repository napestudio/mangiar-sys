import { Skeleton } from "@/components/ui/skeleton";

export default function MenuItemsLoading() {
  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
