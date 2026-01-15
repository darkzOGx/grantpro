import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "GrantPro - School District Grant Automation",
    description:
        "Automate grant discovery, application, and compliance tracking for school districts",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">{children}</body>
        </html>
    );
}
