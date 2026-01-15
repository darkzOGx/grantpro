"use client";

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
    ChevronRight,
} from "lucide-react";

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

    return (
        <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">GrantPro</h1>
                    <p className="text-xs text-gray-500">School District Portal</p>
                </div>
            </div>

            {/* District Selector */}
            <div className="px-4 py-4 border-b border-gray-100">
                {district ? (
                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary-700">
                                    {district.name.charAt(0)}
                                </span>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-gray-900 truncate w-32">
                                    {district.name}
                                </div>
                                <div className="text-xs text-gray-500">{district.state}</div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                ) : (
                    <Link
                        href="/settings"
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-warning-50 hover:bg-warning-100 transition-colors border border-warning-200"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-warning-200 flex items-center justify-center">
                                <span className="text-sm font-bold text-warning-700">?</span>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-warning-800">
                                    Setup Required
                                </div>
                                <div className="text-xs text-warning-600">Add your district</div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-warning-500" />
                    </Link>
                )}
            </div>

            {/* Navigation */}
            <nav className="px-3 py-4 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-5 h-5",
                                    isActive ? "text-primary-600" : "text-gray-400"
                                )}
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Stats - Hidden until real data is available */}
            {/* Will be populated with actual grant/funding stats from DB */}
        </aside>
    );
}
