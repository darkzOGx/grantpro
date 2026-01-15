import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create School District
    const district = await prisma.schoolDistrict.upsert({
        where: { id: "lincoln-unified-ca" },
        update: {},
        create: {
            id: "lincoln-unified-ca",
            name: "Lincoln Unified School District",
            state: "California",
            county: "San Joaquin",
            studentCount: 12000,
            freeLunchPct: 65.0,
            demographics: {
                urbanicity: "suburban",
                minorityPct: 72,
                englishLearnerPct: 28,
                specialEducationPct: 12,
            },
            previousGrants: [
                {
                    name: "Title I School Improvement",
                    year: 2023,
                    amount: 850000,
                    status: "completed",
                },
                {
                    name: "California Arts Council Grant",
                    year: 2024,
                    amount: 45000,
                    status: "active",
                },
            ],
            missionStatement:
                "Lincoln Unified School District is committed to providing a world-class education that prepares every student for success in college, career, and life. We believe in fostering innovation, creativity, and critical thinking while ensuring equitable access to high-quality STEM education and nutritional programs.",
        },
    });

    console.log(`✅ Created district: ${district.name}`);

    // Create Grants
    const grants = await Promise.all([
        // 1. Federal Grant - Title I
        prisma.grant.upsert({
            where: { id: "title-i-school-improvement" },
            update: {},
            create: {
                id: "title-i-school-improvement",
                title: "Title I School Improvement Grant",
                category: "FEDERAL",
                sourceType: "FEDERAL",
                fundingAmountMin: 500000,
                fundingAmountMax: 2000000,
                deadline: new Date("2026-03-15"),
                requirements: {
                    minFreeLunchPct: 40,
                    minStudentCount: 1000,
                    requiredDocuments: [
                        "School Improvement Plan",
                        "Academic Achievement Data",
                        "Parent Involvement Policy",
                    ],
                    focusAreas: ["reading", "math", "graduation rates"],
                },
                eligibilityCriteria:
                    "Schools with 40% or more students from low-income families. Must demonstrate need for academic improvement based on state assessments.",
                description:
                    "Title I School Improvement Grants provide supplemental funding to help schools with high percentages of low-income students meet challenging state academic standards. Funds can be used for instructional programs, professional development, and family engagement.",
                applicationUrl: "https://www.ed.gov/programs/titleiparta",
                isActive: true,
            },
        }),

        // 2. Lunch Program - USDA Fresh Fruit
        prisma.grant.upsert({
            where: { id: "usda-fresh-fruit-vegetable" },
            update: {},
            create: {
                id: "usda-fresh-fruit-vegetable",
                title: "USDA Fresh Fruit and Vegetable Program",
                category: "NUTRITION",
                sourceType: "FEDERAL",
                fundingAmountMin: 50000,
                fundingAmountMax: 200000,
                deadline: new Date("2026-02-28"),
                requirements: {
                    minFreeLunchPct: 50,
                    schoolLevel: ["elementary"],
                    requiredDocuments: [
                        "Nutrition Plan",
                        "Distribution Schedule",
                        "Vendor Agreements",
                    ],
                },
                eligibilityCriteria:
                    "Elementary schools with 50% or more students eligible for free or reduced-price meals. Priority given to schools not currently participating in other fruit/vegetable programs.",
                description:
                    "The FFVP provides fresh fruits and vegetables to students during the school day, separate from lunch or breakfast. The goal is to introduce children to fresh produce they might not otherwise have the opportunity to try.",
                applicationUrl: "https://www.fns.usda.gov/ffvp",
                isActive: true,
            },
        }),

        // 3. Arts Grant - NEA
        prisma.grant.upsert({
            where: { id: "nea-arts-education" },
            update: {},
            create: {
                id: "nea-arts-education",
                title: "NEA Grants for Arts Projects - Arts Education",
                category: "ARTS",
                sourceType: "FEDERAL",
                fundingAmountMin: 10000,
                fundingAmountMax: 100000,
                deadline: new Date("2026-04-20"),
                requirements: {
                    matchFunding: true,
                    matchRatio: 1.0,
                    projectDuration: "12-24 months",
                    requiredDocuments: [
                        "Project Narrative",
                        "Artist Resumes",
                        "Budget Detail",
                        "Letters of Support",
                    ],
                    focusAreas: ["visual arts", "music", "theater", "dance"],
                },
                eligibilityCriteria:
                    "Public schools and districts can partner with nonprofit arts organizations. Projects must provide arts learning opportunities to K-12 students.",
                description:
                    "NEA Grants for Arts Projects support public engagement with, and access to, excellent art. Arts Education projects focus on PreK-12 students and are intended to instill skills such as creativity, collaboration, and critical thinking.",
                applicationUrl: "https://www.arts.gov/grants",
                isActive: true,
            },
        }),

        // 4. Private Foundation - Gates STEM
        prisma.grant.upsert({
            where: { id: "gates-stem-initiative" },
            update: {},
            create: {
                id: "gates-stem-initiative",
                title: "Gates Foundation K-12 STEM Initiative",
                category: "STEM",
                sourceType: "PRIVATE_FOUNDATION",
                fundingAmountMin: 100000,
                fundingAmountMax: 500000,
                deadline: new Date("2026-05-01"),
                requirements: {
                    minStudentCount: 5000,
                    requiredDocuments: [
                        "STEM Curriculum Plan",
                        "Teacher Training Program",
                        "Student Outcome Metrics",
                        "Sustainability Plan",
                    ],
                    focusAreas: [
                        "computer science",
                        "engineering",
                        "mathematics",
                        "science",
                    ],
                    priorityPopulations: ["high poverty", "rural", "underrepresented"],
                },
                eligibilityCriteria:
                    "Public school districts serving predominantly low-income communities. Must demonstrate commitment to expanding STEM education access for underrepresented students.",
                description:
                    "The Gates Foundation STEM Initiative supports innovative approaches to K-12 STEM education. Funding covers curriculum development, teacher professional development, technology infrastructure, and student programming.",
                applicationUrl: "https://www.gatesfoundation.org/education",
                isActive: true,
            },
        }),

        // 5. State Grant - California Clean Energy
        prisma.grant.upsert({
            where: { id: "ca-clean-energy-schools" },
            update: {},
            create: {
                id: "ca-clean-energy-schools",
                title: "California Clean Energy Schools Program",
                category: "INFRASTRUCTURE",
                sourceType: "STATE",
                fundingAmountMin: 250000,
                fundingAmountMax: 1000000,
                deadline: new Date("2026-06-30"),
                requirements: {
                    stateOnly: "California",
                    projectTypes: [
                        "solar installation",
                        "energy efficiency",
                        "EV charging",
                    ],
                    requiredDocuments: [
                        "Energy Audit",
                        "Project Design",
                        "Environmental Review",
                        "Community Benefit Plan",
                    ],
                },
                eligibilityCriteria:
                    "California public school districts. Projects must demonstrate significant energy savings or renewable energy generation. Priority for disadvantaged communities.",
                description:
                    "The California Clean Energy Schools Program provides funding for solar installations, energy efficiency upgrades, and electric vehicle infrastructure at public schools. Projects should integrate sustainability education into curriculum.",
                applicationUrl: "https://www.energy.ca.gov/programs/schools",
                isActive: true,
            },
        }),
    ]);

    console.log(`✅ Created ${grants.length} grants`);

    // Create sample applications with different statuses
    const applications = await Promise.all([
        // Application for Title I (Won - has deliverables)
        prisma.application.upsert({
            where: {
                grantId_districtId: {
                    grantId: "title-i-school-improvement",
                    districtId: "lincoln-unified-ca",
                },
            },
            update: {},
            create: {
                grantId: "title-i-school-improvement",
                districtId: "lincoln-unified-ca",
                status: "WON",
                matchScore: 92,
                autoApplyEnabled: false,
                submittedAt: new Date("2025-11-15"),
            },
        }),

        // Application for USDA Fresh Fruit (Ready for review)
        prisma.application.upsert({
            where: {
                grantId_districtId: {
                    grantId: "usda-fresh-fruit-vegetable",
                    districtId: "lincoln-unified-ca",
                },
            },
            update: {},
            create: {
                grantId: "usda-fresh-fruit-vegetable",
                districtId: "lincoln-unified-ca",
                status: "READY_FOR_REVIEW",
                matchScore: 88,
                autoApplyEnabled: true,
                draftedContent: {
                    narrative:
                        "Lincoln Unified serves over 12,000 students with 65% eligible for free lunch...",
                    programDescription:
                        "We plan to implement a daily fresh fruit and vegetable program across all 8 elementary schools...",
                },
            },
        }),

        // Application for Gates STEM (Drafting)
        prisma.application.upsert({
            where: {
                grantId_districtId: {
                    grantId: "gates-stem-initiative",
                    districtId: "lincoln-unified-ca",
                },
            },
            update: {},
            create: {
                grantId: "gates-stem-initiative",
                districtId: "lincoln-unified-ca",
                status: "DRAFTING",
                matchScore: 78,
                autoApplyEnabled: true,
            },
        }),
    ]);

    console.log(`✅ Created ${applications.length} applications`);

    // Create deliverables for the WON application (Title I)
    const titleIApp = applications[0];
    const deliverables = await Promise.all([
        prisma.deliverable.create({
            data: {
                applicationId: titleIApp.id,
                title: "Submit Quarterly Progress Report Q1",
                description:
                    "Complete and submit the first quarterly progress report including student achievement data and program implementation updates.",
                status: "COMPLETED",
                dueDate: new Date("2026-01-31"),
            },
        }),
        prisma.deliverable.create({
            data: {
                applicationId: titleIApp.id,
                title: "Conduct Mid-Year Assessment",
                description:
                    "Administer standardized assessments to measure student progress in reading and math.",
                status: "REPORTING",
                dueDate: new Date("2026-02-15"),
            },
        }),
        prisma.deliverable.create({
            data: {
                applicationId: titleIApp.id,
                title: "Host Parent Engagement Workshop",
                description:
                    "Organize and conduct parent involvement workshop as outlined in the grant proposal.",
                status: "IMPLEMENTATION",
                dueDate: new Date("2026-03-01"),
            },
        }),
        prisma.deliverable.create({
            data: {
                applicationId: titleIApp.id,
                title: "Annual Financial Audit",
                description:
                    "Complete independent financial audit of grant expenditures.",
                status: "AUDIT",
                dueDate: new Date("2026-06-30"),
            },
        }),
    ]);

    console.log(`✅ Created ${deliverables.length} deliverables`);

    console.log("🎉 Seeding complete!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
