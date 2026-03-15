"use client";

import { useRouter } from "next/navigation";
import { buildSubdomainUrl } from "@/lib/constants";
import type { UserBranchWithRestaurant } from "@/lib/user-branch";

interface BranchPickerProps {
  branches: UserBranchWithRestaurant[];
}

function groupByRestaurant(branches: UserBranchWithRestaurant[]) {
  const map = new Map<
    string,
    {
      restaurant: UserBranchWithRestaurant["restaurant"];
      branches: UserBranchWithRestaurant[];
    }
  >();
  for (const b of branches) {
    const existing = map.get(b.restaurant.id);
    if (existing) {
      existing.branches.push(b);
    } else {
      map.set(b.restaurant.id, { restaurant: b.restaurant, branches: [b] });
    }
  }
  return Array.from(map.values());
}

export default function BranchPicker({ branches }: BranchPickerProps) {
  const router = useRouter();
  const groups = groupByRestaurant(branches);

  function handleSelect(restaurantSlug: string) {
    const url = buildSubdomainUrl(restaurantSlug, "/dashboard");
    if (url.startsWith("http")) {
      window.location.href = url;
    } else {
      router.push(url);
    }
  }

  return (
    <div className="min-h-svh grid place-content-center bg-white text-neutral-900">
      <div className="w-full max-w-md px-8 py-16 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Seleccioná tu restaurante</h1>
          <p className="text-sm text-gray-500 mt-2">
            Tu cuenta tiene acceso a más de un restaurante.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {groups.map(({ restaurant, branches: restaurantBranches }) => (
            <button
              key={restaurant.id}
              onClick={() => handleSelect(restaurant.slug)}
              className="w-full text-left px-6 py-4 rounded-lg border border-gray-200 hover:border-red-900 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <div className="font-semibold text-gray-900">{restaurant.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {restaurantBranches.length === 1
                  ? restaurantBranches[0].branchName
                  : `${restaurantBranches.length} sucursales`}
              </div>
              <div className="text-xs text-red-800 mt-1 font-medium uppercase tracking-wide">
                {restaurantBranches[0].role}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
