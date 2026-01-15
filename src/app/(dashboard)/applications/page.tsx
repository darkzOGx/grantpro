"use client";

import {
    ApplicationStatus,
    STATUS_LABELS,
    CATEGORY_LABELS,
} from "@/types";
import { SuitabilityBadge } from "@/components/grants";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Zap,
    ArrowRight,
} from "lucide-react";

interface Application {
    id: string;
    status: ApplicationStatus;
    matchScore: number;
    autoApplyEnabled: boolean;
    submittedAt: string | null;
    grant: {
        id: string;
        title: string;
        category: string;
        fundingAmountMin: number;
        fundingAmountMax: number;
        deadline: string;
    };
}

const MOCK_APPLICATIONS: Application[] = [
    {
        id: "app-1",
        status: "WON",
        matchScore: 92,
        autoApplyEnabled: false,
        submittedAt: "2025-11-15",
        grant: {
            id: "title-i-school-improvement",
            title: "Title I School Improvement Grant",
            category: "FEDERAL",
            fundingAmountMin: 500000,
            fundingAmountMax: 2000000,
            deadline: "2026-03-15",
        },
    },
    {
        id: "app-2",
        status: "READY_FOR_REVIEW",
        matchScore: 88,
        autoApplyEnabled: true,
        submittedAt: null,
        grant: {
            id: "usda-fresh-fruit-vegetable",
            title: "USDA Fresh Fruit and Vegetable Program",
            category: "NUTRITION",
            fundingAmountMin: 50000,
            fundingAmountMax: 200000,
            deadline: "2026-02-28",
        },
    },
    {
        id: "app-3",
        status: "DRAFTING",
        matchScore: 78,
        autoApplyEnabled: true,
        submittedAt: null,
        grant: {
            id: "gates-stem-initiative",
            title: "Gates Foundation K-12 STEM Initiative",
            category: "STEM",
            fundingAmountMin: 100000,
            fundingAmountMax: 500000,
            deadline: "2026-05-01",
        },
    },
];

const STATUS_CONFIG: Record<
    ApplicationStatus,
    { color: string; bgColor: string; icon: typeof FileText }
> = {
    PENDING_DATA: {
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        icon: FileText,
    },
    DRAFTING: {
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        icon: Clock,
    },
    READY_FOR_REVIEW: {
        color: "text-amber-600",
        bgColor: "bg-amber-100",
        icon: FileText,
    },
    SUBMITTED: {
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        icon: CheckCircle,
    },
    WON: {
        color: "text-green-600",
        bgColor: "bg-green-100",
        icon: CheckCircle,
    },
    LOST: {
        color: "text-red-600",
        bgColor: "bg-red-100",
        icon: XCircle,
    },
};

export default function ApplicationsPage() {
    // Group applications by status
    const applicationsByStatus = MOCK_APPLICATIONS.reduce(
        (acc, app) => {
            if (!acc[app.status]) acc[app.status] = [];
            acc[app.status].push(app);
            return acc;
        },
        {} as Record<ApplicationStatus, Application[]>
    );

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track and manage your grant applications
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">
                        {MOCK_APPLICATIONS.length} total applications
                    </span>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="In Progress"
                    value={
                        MOCK_APPLICATIONS.filter((a) =>
                            ["PENDING_DATA", "DRAFTING", "READY_FOR_REVIEW"].includes(a.status)
                        ).length
                    }
                    color="blue"
                />
                <StatCard
                    label="Submitted"
                    value={
                        MOCK_APPLICATIONS.filter((a) => a.status === "SUBMITTED").length
                    }
                    color="purple"
                />
                <StatCard
                    label="Won"
                    value={MOCK_APPLICATIONS.filter((a) => a.status === "WON").length}
                    color="green"
                />
                <StatCard
                    label="Success Rate"
                    value="75%"
                    color="primary"
                    isPercentage
                />
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                                Grant
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                                Status
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                                Match Score
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                                Funding
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
                                Auto-Apply
                            </th>
                            <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {MOCK_APPLICATIONS.map((app) => {
                            const statusConfig = STATUS_CONFIG[app.status];
                            const StatusIcon = statusConfig.icon;

                            return (
                                <tr
                                    key={app.id}
                                    className="hover:bg-gray-50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-gray-900">
                                                {app.grant.title}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {CATEGORY_LABELS[app.grant.category as keyof typeof CATEGORY_LABELS]} •
                                                Due {formatDate(app.grant.deadline)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                statusConfig.bgColor,
                                                statusConfig.color
                                            )}
                                        >
                                            <StatusIcon className="w-3.5 h-3.5" />
                                            {STATUS_LABELS[app.status]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <SuitabilityBadge
                                            score={app.matchScore}
                                            size="sm"
                                            showLabel={false}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {formatCurrency(app.grant.fundingAmountMin)} -{" "}
                                        {formatCurrency(app.grant.fundingAmountMax)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {app.autoApplyEnabled ? (
                                            <span className="inline-flex items-center gap-1 text-primary-600 text-sm">
                                                <Zap className="w-4 h-4" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Off</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                                            View Details
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function StatCard({
    label,
    value,
    color,
    isPercentage,
}: {
    label: string;
    value: number | string;
    color: "blue" | "purple" | "green" | "primary";
    isPercentage?: boolean;
}) {
    const colors = {
        blue: "bg-blue-50 border-blue-100",
        purple: "bg-purple-50 border-purple-100",
        green: "bg-green-50 border-green-100",
        primary: "bg-primary-50 border-primary-100",
    };

    const textColors = {
        blue: "text-blue-700",
        purple: "text-purple-700",
        green: "text-green-700",
        primary: "text-primary-700",
    };

    return (
        <div
            className={cn(
                "rounded-xl border px-4 py-3",
                colors[color]
            )}
        >
            <div className={cn("text-2xl font-bold", textColors[color])}>
                {value}
            </div>
            <div className="text-sm text-gray-600">{label}</div>
        </div>
    );
}
