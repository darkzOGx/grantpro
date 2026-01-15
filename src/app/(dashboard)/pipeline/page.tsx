"use client";

import { PipelineBoard, PipelineBoardEmpty } from "@/components/pipeline";
import { DeliverableWithApplication, DeliverableStatus } from "@/types";
import { Trophy, TrendingUp, CheckCircle2 } from "lucide-react";

const MOCK_DELIVERABLES: DeliverableWithApplication[] = [
    {
        id: "del-1",
        applicationId: "app-1",
        title: "Submit Quarterly Progress Report Q1",
        description:
            "Complete and submit the first quarterly progress report including student achievement data and program implementation updates.",
        status: "COMPLETED",
        dueDate: new Date("2026-01-31"),
        evidenceLink: null,
        application: {
            grant: {
                title: "Title I School Improvement Grant",
            },
        },
    },
    {
        id: "del-2",
        applicationId: "app-1",
        title: "Conduct Mid-Year Assessment",
        description:
            "Administer standardized assessments to measure student progress in reading and math.",
        status: "REPORTING",
        dueDate: new Date("2026-02-15"),
        evidenceLink: null,
        application: {
            grant: {
                title: "Title I School Improvement Grant",
            },
        },
    },
    {
        id: "del-3",
        applicationId: "app-1",
        title: "Host Parent Engagement Workshop",
        description:
            "Organize and conduct parent involvement workshop as outlined in the grant proposal.",
        status: "IMPLEMENTATION",
        dueDate: new Date("2026-03-01"),
        evidenceLink: null,
        application: {
            grant: {
                title: "Title I School Improvement Grant",
            },
        },
    },
    {
        id: "del-4",
        applicationId: "app-1",
        title: "Annual Financial Audit",
        description: "Complete independent financial audit of grant expenditures.",
        status: "AUDIT",
        dueDate: new Date("2026-06-30"),
        evidenceLink: null,
        application: {
            grant: {
                title: "Title I School Improvement Grant",
            },
        },
    },
];

export default function PipelinePage() {
    const hasDeliverables = MOCK_DELIVERABLES.length > 0;

    const handleStatusChange = async (
        deliverableId: string,
        newStatus: DeliverableStatus
    ) => {
        console.log(`Updating ${deliverableId} to ${newStatus}`);
        // API call would go here
        await new Promise((resolve) => setTimeout(resolve, 500));
    };

    // Calculate stats
    const completedCount = MOCK_DELIVERABLES.filter(
        (d) => d.status === "COMPLETED"
    ).length;
    const totalCount = MOCK_DELIVERABLES.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Compliance Pipeline
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Track deliverables and compliance tasks for your active grants
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">1</div>
                        <div className="text-sm text-gray-500">Active Grants</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {totalCount}
                        </div>
                        <div className="text-sm text-gray-500">Total Deliverables</div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success-50 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-success-600" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-900">
                            {completionRate}%
                        </div>
                        <div className="text-sm text-gray-500">Completion Rate</div>
                    </div>
                </div>
            </div>

            {/* Pipeline Board */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Deliverable Pipeline
                    </h2>
                    <span className="text-sm text-gray-500">
                        Drag cards to update status
                    </span>
                </div>

                {hasDeliverables ? (
                    <PipelineBoard
                        deliverables={MOCK_DELIVERABLES}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    <PipelineBoardEmpty />
                )}
            </div>
        </div>
    );
}
