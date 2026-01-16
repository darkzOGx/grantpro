import { getCurrentDistrict } from "@/lib/actions/organization";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const district = await getCurrentDistrict();

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar district={district} />

            <div className="pl-[var(--sidebar-width)] transition-[padding] duration-300 ease-in-out">
                <DashboardHeader />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
