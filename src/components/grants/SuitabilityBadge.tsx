"use client";

import { cn, getScoreLevel } from "@/lib/utils";
import { CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";

interface SuitabilityBadgeProps {
    score: number;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
}

export function SuitabilityBadge({
    score,
    size = "md",
    showLabel = true,
}: SuitabilityBadgeProps) {
    const level = getScoreLevel(score);

    const config = {
        high: {
            label: "High Match",
            icon: CheckCircle,
            bgColor: "bg-success-50",
            textColor: "text-success-600",
            borderColor: "border-success-500",
        },
        medium: {
            label: "Medium Match",
            icon: AlertCircle,
            bgColor: "bg-warning-50",
            textColor: "text-warning-600",
            borderColor: "border-warning-500",
        },
        low: {
            label: "Low Match",
            icon: AlertTriangle,
            bgColor: "bg-danger-50",
            textColor: "text-danger-600",
            borderColor: "border-danger-500",
        },
    };

    const { label, icon: Icon, bgColor, textColor, borderColor } = config[level];

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs gap-1",
        md: "px-3 py-1 text-sm gap-1.5",
        lg: "px-4 py-1.5 text-base gap-2",
    };

    const iconSizes = {
        sm: "w-3 h-3",
        md: "w-4 h-4",
        lg: "w-5 h-5",
    };

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border font-medium",
                bgColor,
                textColor,
                borderColor,
                sizeClasses[size]
            )}
        >
            <Icon className={iconSizes[size]} />
            {showLabel && <span>{label}</span>}
            <span className="font-bold">{score}%</span>
        </div>
    );
}
