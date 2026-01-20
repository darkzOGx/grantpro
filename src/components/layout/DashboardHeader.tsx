"use client";

import { usePathname } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
        <header className={cn(
            "sticky top-0 z-40 w-full border-b transition-all duration-300",
            "bg-background/80 backdrop-blur-md border-border/40"
        )}>
            <div className="flex items-center justify-between h-16 px-6">
                {/* Left: Breadcrumbs / Title */}
                <div className="flex items-center gap-4">
                    <span className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="hover:text-foreground cursor-pointer transition-colors">GrantPro</span>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="font-medium text-foreground">{title}</span>
                    </span>
                    {/* Mobile Menu Trigger (Placeholder) */}
                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="w-5 h-5" />
                    </Button>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative hidden md:block w-64 lg:w-80">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search grants..."
                            className="pl-9 h-9 bg-muted/50 border-transparent focus:bg-background transition-all"
                        />
                        <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </div>
                </div>
            </div>
        </header>
    );
}
