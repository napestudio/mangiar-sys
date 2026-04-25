import { Skeleton } from "@/components/ui/skeleton";

export default function CashRegistersLoading() {
  return (
    <div className="min-h-svh bg-gray-50">
      <main className="px-4 sm:px-6 lg:px-8 pt-20">
        <div className="py-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
