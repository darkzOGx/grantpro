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

            <div className="pl-64">
                <DashboardHeader />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
