import { getGrants, SortOption } from "@/lib/actions/grants";
import { GrantCard, GrantsFilters } from "@/components/grants";
import { GrantCategory } from "@/types";
import { Search } from "lucide-react";

export default async function GrantsPage({
    searchParams,
}: {
    searchParams: { search?: string; category?: string | string[]; sort?: string };
}) {
    const search = searchParams.search;
    const categories = searchParams.category
        ? (Array.isArray(searchParams.category)
            ? searchParams.category
            : [searchParams.category]) as GrantCategory[]
        : undefined;
    const sortBy = (searchParams.sort || "deadline") as SortOption;

    const grants = await getGrants({ search, categories, sortBy });

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
                        {grants.length} grants available
                    </span>
                </div>
            </div>

            {/* Search and Filters */}
            <GrantsFilters />

            {/* Grants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {grants.map((grant) => (
                    <GrantCard
                        key={grant.id}
                        grant={grant}
                        applicationId={
                            grant.applicationStatus ? `app-${grant.id}` : undefined
                        }
                    // onViewDetails action would be handled via client component wrapper or navigation
                    />
                ))}
            </div>

            {/* Empty State */}
            {grants.length === 0 && (
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
