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
    Bell,
    User,
} from "lucide-react";

const navigation = [
    { name: "Grant Catalog", href: "/grants", icon: Search },
    { name: "My Applications", href: "/applications", icon: FileText },
    { name: "Compliance Pipeline", href: "/pipeline", icon: Kanban },
    { name: "Analytics", href: "/analytics", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
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
                    <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-primary-700">L</span>
                            </div>
                            <div className="text-left">
                                <div className="text-sm font-medium text-gray-900">Lincoln USD</div>
                                <div className="text-xs text-gray-500">California</div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
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

                {/* Bottom Stats */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="px-3 py-2 rounded-lg bg-success-50">
                            <div className="text-lg font-bold text-success-600">3</div>
                            <div className="text-xs text-success-600">Active Grants</div>
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-primary-50">
                            <div className="text-lg font-bold text-primary-600">$1.2M</div>
                            <div className="text-xs text-primary-600">Total Funding</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="pl-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
                    <div className="flex items-center justify-between px-6 py-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {navigation.find((n) => pathname.startsWith(n.href))?.name ||
                                    "Dashboard"}
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
                            </button>
                            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary-600" />
                                </div>
                                <span className="font-medium">Admin</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
