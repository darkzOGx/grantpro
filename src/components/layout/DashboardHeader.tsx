"use client";

import { usePathname } from "next/navigation";
import { Bell, User } from "lucide-react";

// Use constants or shared config for navigation to ensure title matches
const NAVIGATION = [
    { name: "Grant Catalog", href: "/grants" },
    { name: "My Applications", href: "/applications" },
    { name: "Compliance Pipeline", href: "/pipeline" },
    { name: "Analytics", href: "/analytics" },
    { name: "Settings", href: "/settings" },
];

export function DashboardHeader() {
    const pathname = usePathname();
    const currentNav = NAVIGATION.find((n) => pathname.startsWith(n.href));
    const title = currentNav?.name || "Dashboard";

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {title}
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
    );
}
