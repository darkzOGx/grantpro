import { prisma } from "@/lib/prisma";
import { DeliverableWithApplication } from "@/types";

export async function getDeliverables() {
    try {
        const deliverables = await prisma.deliverable.findMany({
            include: {
                application: {
                    include: {
                        grant: {
                            select: {
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                dueDate: "asc",
            },
        });

        // Transform to match the specific type structure if needed,
        // or ensure the Prisma result matches DeliverableWithApplication.
        // Prisma return includes dates as Date objects, which matches the type.
        return deliverables;
    } catch (error) {
        console.error("Error fetching deliverables:", error);
        return [];
    }
}
