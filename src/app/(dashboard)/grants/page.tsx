import { getGrants, SortOption } from "@/lib/actions/grants";
import { GrantsFilters, GrantsGrid } from "@/components/grants";
import { GrantCategory } from "@/types";
import { Search, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

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
                    <h1 className="text-2xl font-bold text-foreground">Grant Catalog</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Discover and apply for grants that match your school district
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                        {grants.length} grants available
                    </span>
                </div>
            </div>

            {/* Search and Filters */}
            <GrantsFilters />

            {/* Grants Grid */}
            <GrantsGrid grants={grants} />

            {/* Empty State */}
            {grants.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        No grants found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filters to find more opportunities
                    </p>
                </div>
            )}

            {/* AI Grant Autofilling - Coming Soon Section */}
            <Card className="mt-12 border-primary/20 bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg text-primary">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-semibold text-foreground">AI Grant Autofilling</CardTitle>
                                <Badge variant="secondary" className="text-xs font-normal bg-muted text-muted-foreground">Coming Soon</Badge>
                            </div>
                            <CardDescription className="text-muted-foreground">Automatically draft complete grant applications using your district profile and previous submissions</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-0 pb-6">
                    {[
                        "Narrative & Descriptions",
                        "Budget Justifications",
                        "Performance Metrics",
                        "Project Timelines",
                        "Compliance Assurances",
                        "Staff Biographies"
                    ].map((feature) => (
                        <div key={feature} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/50">
                            <Checkbox id={feature} disabled />
                            <label htmlFor={feature} className="text-sm font-medium text-muted-foreground cursor-not-allowed">
                                {feature}
                            </label>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
