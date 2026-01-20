"use client";

import { GrantCategory, CATEGORY_LABELS } from "@/types";
import { Search, X, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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

const SORT_OPTIONS = [
    { value: "deadline", label: "Due Date (Soonest)" },
    { value: "value_desc", label: "Highest Value" },
    { value: "value_asc", label: "Lowest Value" },
];

export function GrantsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    // Initial State from URL
    const currentSearch = searchParams.get("search") || "";
    const currentCategories = searchParams.getAll("category") as GrantCategory[];
    const currentSort = searchParams.get("sort") || "deadline";

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

    const handleSort = (sortValue: string) => {
        const params = new URLSearchParams(searchParams);
        if (sortValue && sortValue !== "deadline") {
            params.set("sort", sortValue);
        } else {
            params.delete("sort");
        }
        startTransition(() => {
            router.replace(`?${params.toString()}`);
        });
    };

    const clearFilters = () => {
        router.push("/grants");
    };

    const hasActiveFilters = currentSearch !== "" || currentCategories.length > 0;

    return (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center gap-4">
                {/* Search Input */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search grants by title or keywords..."
                        defaultValue={currentSearch}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                    <select
                        value={currentSort}
                        onChange={(e) => handleSort(e.target.value)}
                        className="px-3 py-2.5 rounded-lg border border-input bg-background text-sm font-medium text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                    >
                        {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value} className="bg-background text-foreground">
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Clear
                    </button>
                )}
            </div>

            {/* Category Filters - Always Visible */}
            <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2">
                    Filter by Category:
                </span>
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                            currentCategories.includes(category)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                    >
                        {CATEGORY_LABELS[category]}
                    </button>
                ))}
            </div>
        </div>
    );
}
