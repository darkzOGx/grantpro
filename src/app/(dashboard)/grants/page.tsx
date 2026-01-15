"use client";

import { useState } from "react";
import { GrantCard } from "@/components/grants";
import { GrantWithScore, GrantCategory, CATEGORY_LABELS } from "@/types";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for the grants catalog
const MOCK_GRANTS: GrantWithScore[] = [
    {
        id: "title-i-school-improvement",
        title: "Title I School Improvement Grant",
        category: "FEDERAL",
        sourceType: "FEDERAL",
        fundingAmountMin: 500000,
        fundingAmountMax: 2000000,
        deadline: new Date("2026-03-15"),
        description:
            "Title I School Improvement Grants provide supplemental funding to help schools with high percentages of low-income students meet challenging state academic standards.",
        isActive: true,
        matchScore: 92,
        applicationStatus: "WON",
        autoApplyEnabled: false,
    },
    {
        id: "usda-fresh-fruit-vegetable",
        title: "USDA Fresh Fruit and Vegetable Program",
        category: "NUTRITION",
        sourceType: "FEDERAL",
        fundingAmountMin: 50000,
        fundingAmountMax: 200000,
        deadline: new Date("2026-02-28"),
        description:
            "The FFVP provides fresh fruits and vegetables to students during the school day, separate from lunch or breakfast.",
        isActive: true,
        matchScore: 88,
        applicationStatus: "READY_FOR_REVIEW",
        autoApplyEnabled: true,
    },
    {
        id: "nea-arts-education",
        title: "NEA Grants for Arts Projects - Arts Education",
        category: "ARTS",
        sourceType: "FEDERAL",
        fundingAmountMin: 10000,
        fundingAmountMax: 100000,
        deadline: new Date("2026-04-20"),
        description:
            "NEA Grants for Arts Projects support public engagement with, and access to, excellent art. Arts Education projects focus on PreK-12 students.",
        isActive: true,
        matchScore: 65,
    },
    {
        id: "gates-stem-initiative",
        title: "Gates Foundation K-12 STEM Initiative",
        category: "STEM",
        sourceType: "PRIVATE_FOUNDATION",
        fundingAmountMin: 100000,
        fundingAmountMax: 500000,
        deadline: new Date("2026-05-01"),
        description:
            "The Gates Foundation STEM Initiative supports innovative approaches to K-12 STEM education.",
        isActive: true,
        matchScore: 78,
        applicationStatus: "DRAFTING",
        autoApplyEnabled: true,
    },
    {
        id: "ca-clean-energy-schools",
        title: "California Clean Energy Schools Program",
        category: "INFRASTRUCTURE",
        sourceType: "STATE",
        fundingAmountMin: 250000,
        fundingAmountMax: 1000000,
        deadline: new Date("2026-06-30"),
        description:
            "The California Clean Energy Schools Program provides funding for solar installations and energy efficiency upgrades at public schools.",
        isActive: true,
        matchScore: 85,
    },
];

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

export default function GrantsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategories, setSelectedCategories] = useState<GrantCategory[]>([]);
    const [showFilters, setShowFilters] = useState(false);

    const toggleCategory = (category: GrantCategory) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category]
        );
    };

    const clearFilters = () => {
        setSearchQuery("");
        setSelectedCategories([]);
    };

    const filteredGrants = MOCK_GRANTS.filter((grant) => {
        const matchesSearch =
            searchQuery === "" ||
            grant.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            grant.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategories.length === 0 ||
            selectedCategories.includes(grant.category);

        return matchesSearch && matchesCategory;
    });

    const hasActiveFilters = searchQuery !== "" || selectedCategories.length > 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Grant Catalog</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Discover and apply for grants that match your school district
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {filteredGrants.length} grants available
                    </span>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search grants by title or keywords..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                        {selectedCategories.length > 0 && (
                            <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {selectedCategories.length}
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
                                        selectedCategories.includes(category)
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

            {/* Grants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGrants.map((grant) => (
                    <GrantCard
                        key={grant.id}
                        grant={grant}
                        applicationId={
                            grant.applicationStatus ? `app-${grant.id}` : undefined
                        }
                        onViewDetails={(id) => console.log("View details:", id)}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredGrants.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No grants found
                    </h3>
                    <p className="text-sm text-gray-500">
                        Try adjusting your search or filters to find more opportunities
                    </p>
                </div>
            )}
        </div>
    );
}
