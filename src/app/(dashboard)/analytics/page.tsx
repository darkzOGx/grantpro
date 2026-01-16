"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, TrendingUp, Users, Target, Download, Calendar } from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";
import { cn } from "@/lib/utils";

const monthlyData = [
    { name: "Jan", applied: 4, secured: 2 },
    { name: "Feb", applied: 6, secured: 3 },
    { name: "Mar", applied: 8, secured: 5 },
    { name: "Apr", applied: 5, secured: 4 },
    { name: "May", applied: 7, secured: 3 },
    { name: "Jun", applied: 9, secured: 6 },
    { name: "Jul", applied: 3, secured: 2 },
];

const sourceData = [
    { name: "Federal", value: 45, color: "#0ea5e9" }, // primary-500
    { name: "State", value: 30, color: "#8b5cf6" },   // violet-500
    { name: "Private", value: 15, color: "#10b981" }, // emerald-500
    { name: "Local", value: 10, color: "#f59e0b" },  // amber-500
];

// Custom tooltip compatible with Royal theme
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border p-2 rounded-lg shadow-lg text-sm">
                <p className="font-semibold mb-1">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AnalyticsPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground data-[theme=royal]:text-white mb-2">Analytics</h1>
                    <p className="text-muted-foreground data-[theme=royal]:text-white/70">
                        Performance metrics and funding insights
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Select defaultValue="fy24">
                        <SelectTrigger className="w-[180px] bg-background data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
                            <Calendar className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fy24">Fiscal Year 2024</SelectItem>
                            <SelectItem value="fy23">Fiscal Year 2023</SelectItem>
                            <SelectItem value="q1">Q1 2024</SelectItem>
                            <SelectItem value="q2">Q2 2024</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                {[
                    { title: "Grant ROI", value: "480%", trend: "+12%", icon: TrendingUp, color: "text-green-500" },
                    { title: "Avg. Award Size", value: "$45,200", trend: "+$5k", icon: DollarSign, color: "text-blue-500" },
                    { title: "Team Win Rate", value: "62%", trend: "+4%", icon: Target, color: "text-purple-500" },
                    { title: "Active Staff", value: "8", trend: "Stable", icon: Users, color: "text-orange-500" },
                ].map((kpi, i) => (
                    <Card key={i} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                            <kpi.icon className={cn("h-4 w-4", kpi.color)} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{kpi.value}</div>
                            <p className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">
                                <span className={cn("font-medium", kpi.color)}>{kpi.trend}</span> vs last period
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Application Performance */}
                <Card className="col-span-4 data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                    <CardHeader>
                        <CardTitle>Application Performance</CardTitle>
                        <CardDescription className="data-[theme=royal]:text-white/60">
                            Applications submitted vs. awards secured
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="applied" name="Submitted" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="secured" name="Awarded" fill="hsl(var(--royal-gold))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Funding Sources */}
                <Card className="col-span-3 data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                    <CardHeader>
                        <CardTitle>Funding Source Distribution</CardTitle>
                        <CardDescription className="data-[theme=royal]:text-white/60">
                            Breakdown by grantor type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={sourceData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {sourceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-8 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold">$1.8M</div>
                                <div className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">Total Federal</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">$600k</div>
                                <div className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">Total State</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Efficiency Metric */}
            <Card className="data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                <CardHeader>
                    <CardTitle>Application Efficiency Trend</CardTitle>
                    <CardDescription className="data-[theme=royal]:text-white/60">
                        Average days to complete application submission
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="applied" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
