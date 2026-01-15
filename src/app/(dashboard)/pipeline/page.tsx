import { getDeliverables } from "@/lib/actions/pipeline";
import { PipelineBoard, PipelineBoardEmpty } from "@/components/pipeline";
import { Trophy, TrendingUp, CheckCircle2 } from "lucide-react";

export default async function PipelinePage() {
    const deliverables = await getDeliverables();
    const hasDeliverables = deliverables.length > 0;

    // Calculate stats
    const completedCount = deliverables.filter(
        (d) => d.status === "COMPLETED"
    ).length;
    const totalCount = deliverables.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Count active grants (unique grant titles in deliverables for now, or fetch separately if needed)
    // A better approach would be to get active grants count from a separate action or count unique grants here.
    // For now, let's keep it simple and count unique application IDs as proxy for grants/projects
    const uniqueApplications = new Set(deliverables.map(d => d.applicationId)).size;

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
                        <div className="text-2xl font-bold text-gray-900">{uniqueApplications}</div>
                        <div className="text-sm text-gray-500">Active Applications</div>
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
                        deliverables={deliverables}
                    // We are not passing onStatusChange here because we can't pass a server function to a client component without it being a Server Action.
                    // Ideally PipelineBoard handles this internally or we need a wrapper.
                    // If PipelineBoard REQUIRES onStatusChange, this will fail type check. 
                    // I will assume for now it's optional or handled. Reviewing the file next will confirm.
                    />
                ) : (
                    <PipelineBoardEmpty />
                )}
            </div>
        </div>
    );
}
