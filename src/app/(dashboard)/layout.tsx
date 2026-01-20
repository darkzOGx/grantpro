import { getCurrentDistrict } from "@/lib/actions/organization";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import React, { Suspense } from 'react';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const district = await getCurrentDistrict();

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <Sidebar district={district} />

            <div className="pl-[var(--sidebar-width)] transition-[padding] duration-300 ease-in-out">
                <DashboardHeader />
                <main className="p-6">
                    <Suspense fallback={<div>Loading...</div>}>
                        {children}
                    </Suspense>
                </main>
            </div>
        </div>
    );
}
