"use client";

import { useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from "@hello-pangea/dnd";
import { DeliverableWithApplication, DeliverableStatus, DELIVERABLE_STATUS_LABELS } from "@/types";
import { formatDate, getDaysUntil, cn } from "@/lib/utils";
import {
    Calendar,
    FileText,
    ExternalLink,
    CheckCircle2,
    Clock,
    AlertTriangle,
} from "lucide-react";

interface PipelineBoardProps {
    deliverables: DeliverableWithApplication[];
    onStatusChange?: (deliverableId: string, newStatus: DeliverableStatus) => Promise<void>;
}

const COLUMNS: DeliverableStatus[] = [
    "IMPLEMENTATION",
    "REPORTING",
    "AUDIT",
    "COMPLETED",
];

const COLUMN_COLORS: Record<DeliverableStatus, { bg: string; border: string; header: string }> = {
    IMPLEMENTATION: {
        bg: "bg-blue-50",
        border: "border-blue-200",
        header: "bg-blue-100 text-blue-800",
    },
    REPORTING: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        header: "bg-amber-100 text-amber-800",
    },
    AUDIT: {
        bg: "bg-purple-50",
        border: "border-purple-200",
        header: "bg-purple-100 text-purple-800",
    },
    COMPLETED: {
        bg: "bg-green-50",
        border: "border-green-200",
        header: "bg-green-100 text-green-800",
    },
};

export function PipelineBoard({ deliverables, onStatusChange }: PipelineBoardProps) {
    const [items, setItems] = useState(deliverables);

    const getItemsByStatus = (status: DeliverableStatus) =>
        items.filter((item) => item.status === status);

    const handleDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;

        // No destination or same position
        if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
            return;
        }

        const newStatus = destination.droppableId as DeliverableStatus;
        const updatedItems = items.map((item) =>
            item.id === draggableId ? { ...item, status: newStatus } : item
        );

        setItems(updatedItems);

        // Call API to persist change
        if (onStatusChange) {
            try {
                await onStatusChange(draggableId, newStatus);
            } catch (error) {
                console.error("Failed to update status:", error);
                setItems(items); // Revert on error
            }
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((status) => {
                    const columnItems = getItemsByStatus(status);
                    const colors = COLUMN_COLORS[status];

                    return (
                        <div
                            key={status}
                            className={cn(
                                "flex-shrink-0 w-80 rounded-xl border-2",
                                colors.bg,
                                colors.border
                            )}
                        >
                            {/* Column Header */}
                            <div
                                className={cn(
                                    "px-4 py-3 rounded-t-lg font-semibold flex items-center justify-between",
                                    colors.header
                                )}
                            >
                                <span>{DELIVERABLE_STATUS_LABELS[status]}</span>
                                <span className="text-sm font-normal opacity-75">
                                    {columnItems.length}
                                </span>
                            </div>

                            {/* Droppable Area */}
                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={cn(
                                            "p-3 min-h-[200px] space-y-3 transition-colors",
                                            snapshot.isDraggingOver && "bg-white/50"
                                        )}
                                    >
                                        {columnItems.map((item, index) => (
                                            <DeliverableCard
                                                key={item.id}
                                                deliverable={item}
                                                index={index}
                                            />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}

interface DeliverableCardProps {
    deliverable: DeliverableWithApplication;
    index: number;
}

function DeliverableCard({ deliverable, index }: DeliverableCardProps) {
    const daysUntil = deliverable.dueDate ? getDaysUntil(deliverable.dueDate) : null;
    const isOverdue = daysUntil !== null && daysUntil < 0;
    const isUrgent = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;

    return (
        <Draggable draggableId={deliverable.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={cn(
                        "bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-grab active:cursor-grabbing transition-shadow",
                        snapshot.isDragging && "shadow-lg ring-2 ring-primary-500"
                    )}
                >
                    {/* Grant Title */}
                    <div className="text-xs text-gray-500 mb-1 truncate">
                        {deliverable.application.grant.title}
                    </div>

                    {/* Deliverable Title */}
                    <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
                        {deliverable.title}
                    </h4>

                    {/* Description */}
                    {deliverable.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                            {deliverable.description}
                        </p>
                    )}

                    {/* Due Date */}
                    {deliverable.dueDate && (
                        <div
                            className={cn(
                                "flex items-center gap-1.5 text-xs px-2 py-1 rounded-md w-fit",
                                isOverdue
                                    ? "bg-danger-50 text-danger-700"
                                    : isUrgent
                                        ? "bg-warning-50 text-warning-700"
                                        : "bg-gray-100 text-gray-600"
                            )}
                        >
                            {isOverdue ? (
                                <AlertTriangle className="w-3 h-3" />
                            ) : isUrgent ? (
                                <Clock className="w-3 h-3" />
                            ) : (
                                <Calendar className="w-3 h-3" />
                            )}
                            <span>
                                {isOverdue
                                    ? `${Math.abs(daysUntil!)} days overdue`
                                    : `Due ${formatDate(deliverable.dueDate)}`}
                            </span>
                        </div>
                    )}

                    {/* Evidence Link */}
                    {deliverable.evidenceLink && (
                        <a
                            href={deliverable.evidenceLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3 h-3" />
                            View Evidence
                        </a>
                    )}
                </div>
            )}
        </Draggable>
    );
}

// Empty state component
export function PipelineBoardEmpty() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Active Deliverables
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
                When you win a grant, your deliverables and compliance tasks will appear here
                for tracking.
            </p>
        </div>
    );
}
