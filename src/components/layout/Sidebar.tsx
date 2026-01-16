"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Search,
    FileText,
    Kanban,
    Settings,
    GraduationCap,
    ChevronLeft,
    ChevronRight,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
    { name: "Grant Catalog", href: "/grants", icon: Search },
    { name: "My Applications", href: "/applications", icon: FileText },
    { name: "Compliance Pipeline", href: "/pipeline", icon: Kanban },
    { name: "Analytics", href: "/analytics", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
    district: {
        name: string;
        state: string;
    } | null;
}

export function Sidebar({ district }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = React.useState(false);

    React.useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty("--sidebar-width", collapsed ? "70px" : "16rem");
    }, [collapsed]);


    return (
        <aside
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out border-r",
                // Theme Adaptability
                "bg-background border-border",
                // Royal Mode overrides
                "data-[theme=royal]:bg-gradient-to-b data-[theme=royal]:from-[hsl(315,41%,25%)] data-[theme=royal]:to-[hsl(315,41%,15%)] data-[theme=royal]:border-[hsl(315,41%,35%)]",
                collapsed ? "w-[70px]" : "w-64"
            )}
            data-theme-target="sidebar" // Helper for theme targeting if needed
        >
            {/* Logo Section */}
            <div className={cn(
                "flex items-center gap-3 px-4 py-5 border-b border-border/40",
                "data-[theme=royal]:border-[hsl(315,41%,35%)]"
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20",
                    "data-[theme=royal]:from-royal-gold data-[theme=royal]:to-[hsl(40,80%,40%)] data-[theme=royal]:text-white data-[theme=royal]:shadow-[hsl(45,68%,47%,0.3)]"
                )}>
                    <GraduationCap className="w-6 h-6" />
                </div>

                <div className={cn(
                    "transition-all duration-300 overflow-hidden whitespace-nowrap",
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}>
                    <h1 className="text-xl font-bold text-foreground data-[theme=royal]:text-white tracking-tight">
                        GrantPro
                    </h1>
                    <p className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">
                        School Portal
                    </p>
                </div>
            </div>

            {/* District Selector / Status */}
            <div className="px-3 py-4">
                {district ? (
                    <div className={cn(
                        "flex items-center gap-3 p-2 rounded-lg transition-colors overflow-hidden",
                        "bg-muted/50 border border-transparent hover:bg-muted",
                        "data-[theme=royal]:bg-white/5 data-[theme=royal]:hover:bg-white/10 data-[theme=royal]:text-white",
                        collapsed && "justify-center p-2"
                    )}>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold data-[theme=royal]:bg-white/10 data-[theme=royal]:text-royal-gold">
                            {district.name.charAt(0)}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 truncate">
                                <div className="text-sm font-medium truncate">{district.name}</div>
                                <div className="text-xs opacity-70">{district.state}</div>
                            </div>
                        )}
                    </div>
                ) : (
                    !collapsed && (
                        <Link
                            href="/settings"
                            className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                ?
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-orange-700 dark:text-orange-400 group-hover:text-orange-800">Complete Setup</div>
                                <div className="text-xs text-orange-600/80 dark:text-orange-400/80">Add District Info</div>
                            </div>
                        </Link>
                    )
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/10 text-primary data-[theme=royal]:bg-white/10 data-[theme=royal]:text-royal-gold"
                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground data-[theme=royal]:text-white/70 data-[theme=royal]:hover:bg-white/5 data-[theme=royal]:hover:text-white",
                                collapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5 transition-transform group-hover:scale-110",
                                    isActive ? "text-primary data-[theme=royal]:text-royal-gold" : "text-muted-foreground/70 data-[theme=royal]:text-white/50 group-hover:text-foreground data-[theme=royal]:group-hover:text-white"
                                )}
                            />
                            {!collapsed && (
                                <span>{item.name}</span>
                            )}
                            {isActive && !collapsed && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full data-[theme=royal]:bg-royal-gold" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Utilities */}
            <div className={cn(
                "p-3 border-t border-border/40 space-y-2",
                "data-[theme=royal]:border-[hsl(315,41%,35%)]"
            )}>
                {/* Collapse Toggle */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full justify-between items-center text-muted-foreground hover:text-foreground data-[theme=royal]:text-white/60 data-[theme=royal]:hover:text-white data-[theme=royal]:hover:bg-white/10"
                >
                    {!collapsed && <span>Collapse</span>}
                    {collapsed ? <ChevronRight className="w-4 h-4 ml-auto" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>

                <div className={cn("flex items-center gap-2", collapsed ? "flex-col" : "justify-between")}>
                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full overflow-hidden shrink-0 data-[theme=royal]:hover:bg-white/10">
                                <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    JD
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56 mb-2">
                            <div className="flex items-center gap-2 p-2 mb-2 bg-muted/50 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs">JD</div>
                                <div className="text-xs">
                                    <div className="font-semibold">Jane Doe</div>
                                    <div className="text-muted-foreground">admin@district.edu</div>
                                </div>
                            </div>
                            <DropdownMenuItem>Profile</DropdownMenuItem>
                            <DropdownMenuItem>Billing</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Log out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <ThemeToggle />
                </div>
            </div>
        </aside>
    );
}
