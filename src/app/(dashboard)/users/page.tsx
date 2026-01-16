"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Filter, Download } from "lucide-react";

// Mock Data
const users = [
    {
        id: "USR-001",
        name: "Dr. Maria Santos",
        email: "msantos@lincolnusd.org",
        role: "Administrator",
        status: "Active",
        lastActive: "2 mins ago",
        department: "Superintendent's Office",
        avatar: "",
    },
    {
        id: "USR-002",
        name: "Robert Chen",
        email: "rchen@lincolnusd.org",
        role: "Finance Manager",
        status: "Active",
        lastActive: "1 hour ago",
        department: "Business Services",
        avatar: "",
    },
    {
        id: "USR-003",
        name: "Sarah Miller",
        email: "smiller@lincolnusd.org",
        role: "Grant Coordinator",
        status: "Active",
        lastActive: "15 mins ago",
        department: "Educational Services",
        avatar: "",
    },
    {
        id: "USR-004",
        name: "James Wilson",
        email: "jwilson@lincolnusd.org",
        role: "Principal",
        status: "Offline",
        lastActive: "2 days ago",
        department: "Lincoln High School",
        avatar: "",
    },
    {
        id: "USR-005",
        name: "Elena Rodriguez",
        email: "erodriguez@lincolnusd.org",
        role: "Reviewer",
        status: "Pending",
        lastActive: "Never",
        department: "Special Education",
        avatar: "",
    },
];

export default function UsersPage() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground data-[theme=royal]:text-white mb-2">Users & Permissions</h1>
                    <p className="text-muted-foreground data-[theme=royal]:text-white/70">
                        Manage team members and access roles
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="royal">
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                    </Button>
                </div>
            </div>

            <Card className="data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10 data-[theme=royal]:text-white">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="data-[theme=royal]:text-white">Team Members</CardTitle>
                            <CardDescription className="data-[theme=royal]:text-white/60">
                                View and manage staff accounts
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users..."
                                    className="pl-9 data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20"
                                />
                            </div>
                            <Button variant="outline" size="icon" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
                                <Filter className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="data-[theme=royal]:border-white/10 data-[theme=royal]:hover:bg-white/5">
                                <TableHead className="data-[theme=royal]:text-white/70">User</TableHead>
                                <TableHead className="data-[theme=royal]:text-white/70">Role</TableHead>
                                <TableHead className="data-[theme=royal]:text-white/70">Status</TableHead>
                                <TableHead className="data-[theme=royal]:text-white/70">Last Active</TableHead>
                                <TableHead className="text-right data-[theme=royal]:text-white/70">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} className="data-[theme=royal]:border-white/10 data-[theme=royal]:hover:bg-white/5">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 data-[theme=royal]:ring-1 data-[theme=royal]:ring-white/20">
                                                <AvatarImage src={user.avatar} alt={user.name} />
                                                <AvatarFallback className="data-[theme=royal]:bg-white/20 data-[theme=royal]:text-white">
                                                    {user.name.charAt(0)}{user.name.split(" ")[1]?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold data-[theme=royal]:text-white">{user.name}</div>
                                                <div className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">{user.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="data-[theme=royal]:text-white">{user.role}</span>
                                            <span className="text-xs text-muted-foreground data-[theme=royal]:text-white/50">{user.department}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'Active' ? 'default' : 'secondary'} className={cn(
                                            user.status === 'Active' && "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200 data-[theme=royal]:bg-green-500/20 data-[theme=royal]:text-green-300 data-[theme=royal]:border-green-500/30",
                                            user.status === 'Pending' && "bg-yellow-500/15 text-yellow-700 hover:bg-yellow-500/25 border-yellow-200 data-[theme=royal]:bg-yellow-500/20 data-[theme=royal]:text-yellow-300 data-[theme=royal]:border-yellow-500/30",
                                            user.status === 'Offline' && "bg-gray-100 text-gray-700 border-gray-200 data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white/60 data-[theme=royal]:border-white/10"
                                        )}>
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground data-[theme=royal]:text-white/60">{user.lastActive}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 data-[theme=royal]:text-white/70 data-[theme=royal]:hover:text-white data-[theme=royal]:hover:bg-white/10">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>View Profile</DropdownMenuItem>
                                                <DropdownMenuItem>Edit Permissions</DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">Revoke Access</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
