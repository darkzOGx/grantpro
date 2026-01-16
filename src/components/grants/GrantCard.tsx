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
        <div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-200">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 transition-colors">
                <a
                    href={grant.applicationUrl || grant.sourceUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary-600 outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
                >
                    {grant.title}
                </a>
            </h3>

            {/* Description */}
            {grant.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {grant.description}
                </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Funding Amount */}
                <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium">
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
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span
                        className={cn(
                            "font-medium",
                            isPastDue
                                ? "text-danger-600"
                                : isUrgent
                                    ? "text-warning-600"
                                    : "text-gray-700"
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
                            ? "bg-warning-50 text-warning-700"
                            : "bg-gray-50 text-gray-600"
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
                <div className="mb-4 px-3 py-2 rounded-lg bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">Application Status</div>
                    <div className="text-sm font-medium text-gray-800">
                        {STATUS_LABELS[grant.applicationStatus]}
                    </div>
                </div>
            )}

            {/* Auto-Apply Toggle */}
            {applicationId && grant.applicationStatus && (
                <div className="mb-4 pt-4 border-t border-gray-100">
                    <AutoApplyToggle
                        applicationId={applicationId}
                        grantId={grant.id}
                        enabled={grant.autoApplyEnabled || false}
                        status={grant.applicationStatus}
                    />
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                {onViewDetails ? (
                    <button
                        onClick={() => onViewDetails(grant.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >
                        View Details
                    </button>
                ) : (
                    <a
                        href={grant.applicationUrl || grant.sourceUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
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
                            ? "text-gray-500 hover:text-primary-600 hover:bg-primary-50 border-gray-200 hover:border-primary-200"
                            : "text-gray-300 border-transparent cursor-not-allowed"
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
