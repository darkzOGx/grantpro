"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, DollarSign, FileText, CheckCircle, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const stats = [
    {
        title: "Total Funding Secured",
        value: "$2.4M",
        change: "+12.5%",
        icon: DollarSign,
        trend: "up",
        color: "text-emerald-500",
    },
    {
        title: "Active Applications",
        value: "12",
        change: "+4",
        icon: FileText,
        trend: "up",
        color: "text-blue-500",
    },
    {
        title: "Success Rate",
        value: "68%",
        change: "+2.1%",
        icon: CheckCircle,
        trend: "up",
        color: "text-purple-500",
    },
    {
        title: "Upcoming Deadlines",
        value: "3",
        change: "This Week",
        icon: Clock,
        trend: "neutral",
        color: "text-orange-500",
    },
];

const chartData = [
    { month: "Jan", amount: 120000 },
    { month: "Feb", amount: 180000 },
    { month: "Mar", amount: 160000 },
    { month: "Apr", amount: 240000 },
    { month: "May", amount: 210000 },
    { month: "Jun", amount: 320000 },
];

const recentActivity = [
    {
        id: 1,
        title: "Grant Application Submitted",
        description: "Title I Technology Enhancement submitted for review",
        time: "2 hours ago",
        status: "success",
    },
    {
        id: 2,
        title: "New Matching Grant Found",
        description: "STEM Education Initiative matches your profile",
        time: "5 hours ago",
        status: "info",
    },
    {
        id: 3,
        title: "Compliance Document Due",
        description: "Quarterly budget report needed for SPED grant",
        time: "1 day ago",
        status: "warning",
    },
];

export default function DashboardPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground data-[theme=royal]:text-white mb-2">Dashboard Overview</h1>
                    <p className="text-muted-foreground data-[theme=royal]:text-white/70">Welcome back! Here's what's happening in your district.</p>
                </div>
                <Button className="hidden sm:flex" variant="royal">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    New Application
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={cn("h-4 w-4 text-muted-foreground", stat.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">
                                <span className={cn("font-medium", stat.color)}>{stat.change}</span> from last month
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Chart */}
                <Card className="col-span-4 data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                    <CardHeader>
                        <CardTitle>Funding Timeline</CardTitle>
                        <CardDescription className="data-[theme=royal]:text-white/60">Projected vs Secured funding for FY 2024</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="month"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="hsl(var(--primary))"
                                        fillOpacity={1}
                                        fill="url(#colorAmount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="col-span-3 data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription className="data-[theme=royal]:text-white/60">Latest updates from your team</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.map((activity, index) => (
                                <div key={activity.id} className="flex items-center animate-in slide-in-from-right-4 fade-in duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                    <span className={cn(
                                        "relative flex h-2 w-2 rounded-full mr-4",
                                        activity.status === 'success' ? 'bg-green-500' :
                                            activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                    )}>
                                        <span className={cn(
                                            "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
                                            activity.status === 'success' ? 'bg-green-400' :
                                                activity.status === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                                        )} />
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{activity.title}</p>
                                        <p className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">{activity.description}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-muted-foreground data-[theme=royal]:text-white/50">{activity.time}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                        <Button variant="outline" className="w-full mt-4 data-[theme=royal]:border-white/20 data-[theme=royal]:text-white data-[theme=royal]:hover:bg-white/10">View All Activity</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
