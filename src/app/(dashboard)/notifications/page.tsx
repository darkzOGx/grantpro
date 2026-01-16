"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Clock, AlertTriangle, FileText, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const notifications = [
    {
        id: 1,
        title: "Grant Application Approved",
        description: "Your application for the 'Tech for All' grant has been approved by the state board.",
        time: "10 minutes ago",
        type: "success",
        icon: Check,
        read: false,
    },
    {
        id: 2,
        title: "Document Review Needed",
        description: "The Annual Budget Report 2024 requires your signature before submission.",
        time: "1 hour ago",
        type: "warning",
        icon: AlertTriangle,
        read: false,
    },
    {
        id: 3,
        title: "New Grant Opportunity",
        description: "A new Federal matching grant for STEM education has been added to the catalog.",
        time: "3 hours ago",
        type: "info",
        icon: FileText,
        read: true,
    },
    {
        id: 4,
        title: "System Update Scheduled",
        description: "GrantPro will be undergoing maintenance on Saturday at 2:00 AM PST.",
        time: "1 day ago",
        type: "neutral",
        icon: Settings,
        read: true,
    },
    {
        id: 5,
        title: "Compliance Deadline Approaching",
        description: "Title I Quarterly Report is due in 3 days.",
        time: "2 days ago",
        type: "warning",
        icon: Clock,
        read: true,
    },
];

export default function NotificationsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground data-[theme=royal]:text-white mb-2">Notifications</h1>
                    <p className="text-muted-foreground data-[theme=royal]:text-white/70">
                        Stay updated with alerts and deadlines
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
                        Mark all as read
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {notifications.map((notification) => (
                    <Card
                        key={notification.id}
                        className={cn(
                            "transition-all duration-200 hover:shadow-md data-[theme=royal]:border-white/10 data-[theme=royal]:text-white group",
                            notification.read
                                ? "bg-card/50 data-[theme=royal]:bg-white/5 opacity-80"
                                : "bg-card border-l-4 border-l-primary data-[theme=royal]:bg-white/10 data-[theme=royal]:border-l-royal-gold shadow-sm"
                        )}
                    >
                        <div className="flex items-start p-4 gap-4">
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-full shrink-0",
                                notification.type === 'success' && "bg-green-100 text-green-600 data-[theme=royal]:bg-green-500/20 data-[theme=royal]:text-green-400",
                                notification.type === 'warning' && "bg-yellow-100 text-yellow-600 data-[theme=royal]:bg-yellow-500/20 data-[theme=royal]:text-yellow-400",
                                notification.type === 'info' && "bg-blue-100 text-blue-600 data-[theme=royal]:bg-blue-500/20 data-[theme=royal]:text-blue-400",
                                notification.type === 'neutral' && "bg-gray-100 text-gray-600 data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white/60",
                            )}>
                                <notification.icon className="w-5 h-5" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <h3 className={cn("font-semibold text-lg leading-none mb-1", notification.read && "text-muted-foreground data-[theme=royal]:text-white/70")}>{notification.title}</h3>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2 data-[theme=royal]:text-white/50">{notification.time}</span>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed data-[theme=royal]:text-white/70">{notification.description}</p>
                            </div>

                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="text-center pt-4">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground data-[theme=royal]:text-white/50 data-[theme=royal]:hover:text-white">
                    Load older notifications
                </Button>
            </div>
        </div>
    );
}
