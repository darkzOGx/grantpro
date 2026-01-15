"use client";

import { GrantCategory, CATEGORY_LABELS } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { useDebouncedCallback } from "use-debounce";

const CATEGORIES: GrantCategory[] = [
    "FEDERAL",
    "STATE",
    "NUTRITION",
    "ARTS",
    "STEM",
    "INFRASTRUCTURE",
    "PRIVATE_FOUNDATION",
    "CORPORATE",
];

export function GrantsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [showFilters, setShowFilters] = useState(false);

    // Initial State from URL
    const currentSearch = searchParams.get("search") || "";
    const currentCategories = searchParams.getAll("category") as GrantCategory[];

    // Debounced Search
    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        startTransition(() => {
            router.replace(`?${params.toString()}`);
        });
    }, 300);

    const toggleCategory = (category: GrantCategory) => {
        const params = new URLSearchParams(searchParams);
        const current = params.getAll("category");

        params.delete("category");

        let newCategories: string[];
        if (current.includes(category)) {
            newCategories = current.filter(c => c !== category);
        } else {
            newCategories = [...current, category];
        }

        newCategories.forEach(c => params.append("category", c));

        startTransition(() => {
            router.replace(`?${params.toString()}`);
        });
    };

    const clearFilters = () => {
        router.push("/grants");
    };

    const hasActiveFilters = currentSearch !== "" || currentCategories.length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search grants by title or keywords..."
                        defaultValue={currentSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                    />
                </div>

                {/* Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2.5 rounded-lg border font-medium text-sm transition-colors",
                        showFilters
                            ? "bg-primary-50 border-primary-200 text-primary-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                    {currentCategories.length > 0 && (
                        <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {currentCategories.length}
                        </span>
                    )}
                </button>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Category Filters */}
            {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-700 mb-3">
                        Filter by Category
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((category) => (
                            <button
                                key={category}
                                onClick={() => toggleCategory(category)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                                    currentCategories.includes(category)
                                        ? "bg-primary-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                {CATEGORY_LABELS[category]}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
