"use client";

import { GrantWithScore, CATEGORY_LABELS, STATUS_LABELS } from "@/types";
import { SuitabilityBadge } from "./SuitabilityBadge";
import { AutoApplyToggle } from "./AutoApplyToggle";
import { formatCurrency, formatDate, getDaysUntil, cn } from "@/lib/utils";
import {
    Calendar,
    DollarSign,
    ExternalLink,
    Clock,
    Building2,
} from "lucide-react";

interface GrantCardProps {
    grant: GrantWithScore;
    applicationId?: string;
    onViewDetails?: (grantId: string) => void;
}

export function GrantCard({ grant, applicationId, onViewDetails }: GrantCardProps) {
    const daysUntilDeadline = getDaysUntil(grant.deadline);
    const isUrgent = daysUntilDeadline <= 14 && daysUntilDeadline > 0;
    const isPastDue = daysUntilDeadline < 0;

    const categoryColors: Record<string, string> = {
        FEDERAL: "bg-blue-100 text-blue-800",
        STATE: "bg-purple-100 text-purple-800",
        NUTRITION: "bg-green-100 text-green-800",
        ARTS: "bg-pink-100 text-pink-800",
        STEM: "bg-orange-100 text-orange-800",
        INFRASTRUCTURE: "bg-gray-100 text-gray-800",
        PRIVATE_FOUNDATION: "bg-indigo-100 text-indigo-800",
        CORPORATE: "bg-teal-100 text-teal-800",
        OTHER: "bg-slate-100 text-slate-800",
    };

    return (
        <div className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50">
            {/* Category Badge */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <span
                    className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                        categoryColors[grant.category]
                    )}
                >
                    <Building2 className="w-3 h-3" />
                    {CATEGORY_LABELS[grant.category]}
                </span>

                {/* Match Score Badge */}
                {grant.matchScore !== undefined && (
                    <SuitabilityBadge score={grant.matchScore} size="sm" />
                )}
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-card-foreground mb-2 line-clamp-2 transition-colors">
                <a
                    href={grant.applicationUrl || grant.sourceUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                >
                    {grant.title}
                </a>
            </h3>

            {/* Description */}
            {grant.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-4 whitespace-pre-line leading-relaxed">
                    {grant.description}
                </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Funding Amount */}
                <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">
                        {Number(grant.fundingAmountMin) === 0 && Number(grant.fundingAmountMax) === 0 ? (
                            "Contact for details"
                        ) : Number(grant.fundingAmountMin) === Number(grant.fundingAmountMax) ? (
                            formatCurrency(Number(grant.fundingAmountMax))
                        ) : (
                            `${formatCurrency(Number(grant.fundingAmountMin))} - ${formatCurrency(Number(grant.fundingAmountMax))}`
                        )}
                    </span>
                </div>

                {/* Deadline */}
                <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span
                        className={cn(
                            "font-medium",
                            isPastDue
                                ? "text-destructive"
                                : isUrgent
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : "text-foreground"
                        )}
                    >
                        {formatDate(grant.deadline)}
                    </span>
                </div>
            </div>

            {/* Deadline Countdown */}
            {!isPastDue && (
                <div
                    className={cn(
                        "flex items-center gap-1.5 text-xs mb-4 px-2 py-1 rounded",
                        isUrgent
                            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    <Clock className="w-3 h-3" />
                    <span>
                        {daysUntilDeadline === 0
                            ? "Due today!"
                            : `${daysUntilDeadline} days remaining`}
                    </span>
                </div>
            )}

            {/* Application Status */}
            {grant.applicationStatus && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-muted">
                    <div className="text-xs text-muted-foreground mb-1">Application Status</div>
                    <div className="text-sm font-medium text-foreground">
                        {STATUS_LABELS[grant.applicationStatus]}
                    </div>
                </div>
            )}

            {/* Auto-Apply Toggle */}
            {applicationId && grant.applicationStatus && (
                <div className="mb-4 pt-4 border-t border-border">
                    <AutoApplyToggle
                        applicationId={applicationId}
                        grantId={grant.id}
                        enabled={grant.autoApplyEnabled || false}
                        status={grant.applicationStatus}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-border">
                {onViewDetails ? (
                    <button
                        onClick={() => onViewDetails(grant.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        View Details
                    </button>
                ) : (
                    <a
                        href={grant.applicationUrl || grant.sourceUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        View Details
                        <ExternalLink className="w-4 h-4" />
                    </a>
                )}
                {/* External Link */}
                <a
                    href={grant.applicationUrl || grant.sourceUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "inline-flex items-center justify-center p-2 rounded-lg transition-colors border",
                        (grant.applicationUrl || grant.sourceUrl)
                            ? "text-muted-foreground hover:text-primary hover:bg-primary/10 border-border hover:border-primary/20"
                            : "text-muted-foreground/50 border-transparent cursor-not-allowed"
                    )}
                    title={grant.applicationUrl || grant.sourceUrl ? "Open official grant website" : "No external link available"}
                    onClick={(e) => {
                        if (!grant.applicationUrl && !grant.sourceUrl) {
                            e.preventDefault();
                        }
                    }}
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>
        </div>
    );
}
