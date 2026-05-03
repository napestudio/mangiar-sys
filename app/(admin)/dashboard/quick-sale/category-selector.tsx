"use client";

import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelect: (id: string | null) => void;
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
}: CategorySelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "shrink-0 px-4 py-3.5 rounded-md text-sm font-medium border transition-colors",
          selectedCategoryId === null
            ? "bg-gray-900 text-white border-gray-900"
            : "bg-white text-gray-700 border-gray-300 hover:border-gray-500",
        )}
      >
        Todos
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "shrink-0 px-4 py-3.5 rounded-md text-sm font-medium border transition-colors",
            selectedCategoryId === cat.id
              ? "bg-gray-900 text-white border-gray-900"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500",
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
