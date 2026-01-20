"use client";

import { useState } from "react";
import { GrantWithScore } from "@/types";
import { GrantCard } from "./GrantCard";
import { GrantDetailsModal } from "./GrantDetailsModal";

interface GrantsGridProps {
    grants: GrantWithScore[];
}

export function GrantsGrid({ grants }: GrantsGridProps) {
    const [selectedGrant, setSelectedGrant] = useState<GrantWithScore | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {grants.map((grant) => (
                    <GrantCard
                        key={grant.id}
                        grant={grant}
                        applicationId={
                            grant.applicationStatus ? `app-${grant.id}` : undefined
                        }
                        onViewDetails={() => setSelectedGrant(grant)}
                    />
                ))}
            </div>

            <GrantDetailsModal
                grant={selectedGrant}
                isOpen={!!selectedGrant}
                onClose={() => setSelectedGrant(null)}
            />
        </>
    );
}