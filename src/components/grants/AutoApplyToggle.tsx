"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Zap } from "lucide-react";

interface AutoApplyToggleProps {
    applicationId: string;
    grantId: string;
    enabled: boolean;
    status: string;
    onToggle?: (enabled: boolean) => Promise<void>;
}

export function AutoApplyToggle({
    applicationId,
    grantId,
    enabled,
    status,
    onToggle,
}: AutoApplyToggleProps) {
    const [isEnabled, setIsEnabled] = useState(enabled);
    const [isPending, startTransition] = useTransition();

    const canToggle = !["SUBMITTED", "WON", "LOST"].includes(status);

    const handleToggle = () => {
        if (!canToggle || isPending) return;

        const newValue = !isEnabled;
        setIsEnabled(newValue);

        startTransition(async () => {
            try {
                if (onToggle) {
                    await onToggle(newValue);
                } else {
                    // Default API call
                    await fetch(`/api/applications/${applicationId}/auto-apply`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ enabled: newValue }),
                    });
                }
            } catch (error) {
                console.error("Failed to toggle auto-apply:", error);
                setIsEnabled(!newValue); // Revert on error
            }
        });
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleToggle}
                disabled={!canToggle || isPending}
                className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                    isEnabled ? "bg-primary-600" : "bg-gray-200",
                    (!canToggle || isPending) && "cursor-not-allowed opacity-50"
                )}
                role="switch"
                aria-checked={isEnabled}
                aria-label="Toggle Auto-Apply"
            >
                <span
                    className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isEnabled ? "translate-x-5" : "translate-x-0"
                    )}
                >
                    {isPending && (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    )}
                </span>
            </button>

            <div className="flex items-center gap-1.5">
                <Zap
                    className={cn(
                        "h-4 w-4",
                        isEnabled ? "text-primary-600" : "text-gray-400"
                    )}
                />
                <span
                    className={cn(
                        "text-sm font-medium",
                        isEnabled ? "text-primary-600" : "text-gray-500"
                    )}
                >
                    {isEnabled ? "Auto-Apply ON" : "Auto-Apply OFF"}
                </span>
            </div>

            {!canToggle && (
                <span className="text-xs text-gray-400">
                    (Locked - {status.replace("_", " ")})
                </span>
            )}
        </div>
    );
}
