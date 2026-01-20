import { getApplications } from "@/lib/actions/applications";
import { ApplicationStatus, STATUS_LABELS, CATEGORY_LABELS } from "@/types";
import { SuitabilityBadge } from "@/components/grants";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    Zap,
    ArrowRight,
} from "lucide-react";

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

export default async function ApplicationsPage() {
    const applications = await getApplications();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track and manage your grant applications
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                        {applications.length} total applications
                    </span>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="In Progress"
                    value={
                        applications.filter((a) =>
                            ["PENDING_DATA", "DRAFTING", "READY_FOR_REVIEW"].includes(a.status)
                        ).length
                    }
                    color="blue"
                />
                <StatCard
                    label="Submitted"
                    value={
                        applications.filter((a) => a.status === "SUBMITTED").length
                    }
                    color="purple"
                />
                <StatCard
                    label="Won"
                    value={applications.filter((a) => a.status === "WON").length}
                    color="green"
                />
                <StatCard
                    label="Success Rate"
                    value={(() => {
                        const completed = applications.filter((a) => a.status === "WON" || a.status === "LOST");
                        if (completed.length === 0) return "N/A";
                        const won = applications.filter((a) => a.status === "WON").length;
                        return `${Math.round((won / completed.length) * 100)}%`;
                    })()}
                    color="primary"
                    isPercentage
                />
            </div>

            {/* Applications Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted border-b border-border">
                        <tr>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                Grant
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                Status
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                Match Score
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                Funding
                            </th>
                            <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                                Auto-Apply
                            </th>
                            <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {applications.map((app) => {
                            const statusConfig = STATUS_CONFIG[app.status];
                            const StatusIcon = statusConfig.icon;

                            return (
                                <tr
                                    key={app.id}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-foreground">
                                                {app.grant.title}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {CATEGORY_LABELS[app.grant.category as keyof typeof CATEGORY_LABELS]} •
                                                Due {formatDate(new Date(app.grant.deadline))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                                // Adjust status colors for dark mode compatibility if needed
                                                // For now, we'll keep them but might need bg-opacity
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
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        {formatCurrency(app.grant.fundingAmountMin)} -{" "}
                                        {formatCurrency(app.grant.fundingAmountMax)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {app.autoApplyEnabled ? (
                                                <span className="inline-flex items-center gap-1 text-primary text-sm">
                                                    <Zap className="w-4 h-4" />
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">Off</span>
                                            )}
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal bg-muted text-muted-foreground border-none">Coming Soon</Badge>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80">
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
    // Mapping colors to theme-aware classes
    // In dark/royal mode, we want subtle backgrounds or just borders
    // Simplified approach: Use border colors based on prop, transparent bg or subtle bg
    
    const colorStyles = {
        blue: "border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800 text-blue-700 dark:text-blue-300",
        purple: "border-purple-200 bg-purple-50/50 dark:bg-purple-900/20 dark:border-purple-800 text-purple-700 dark:text-purple-300",
        green: "border-green-200 bg-green-50/50 dark:bg-green-900/20 dark:border-green-800 text-green-700 dark:text-green-300",
        primary: "border-primary/20 bg-primary/5 text-primary",
    };

    return (
        <div
            className={cn(
                "rounded-xl border px-4 py-3 transition-colors",
                colorStyles[color]
            )}
        >
            <div className="text-2xl font-bold font-mono tracking-tight">
                {value}
            </div>
            <div className="text-sm opacity-80">{label}</div>
        </div>
    );
}
