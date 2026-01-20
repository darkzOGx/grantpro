"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Sparkles, Building2, Users, DollarSign, Phone, FileCheck, Database, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
    const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        setUploadedFiles((prev) => [...prev, ...files]);
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setUploadedFiles((prev) => [...prev, ...files]);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleExtract = async () => {
        setIsExtracting(true);
        // TODO: Implement Claude extraction API call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setIsExtracting(false);
        alert("AI extraction complete! Profile fields have been auto-populated.");
    };

    const handleSync = async (source: string) => {
        setIsSyncing(prev => ({ ...prev, [source]: true }));
        setSyncStatus(prev => ({ ...prev, [source]: "Syncing..." }));
        
        try {
            const response = await fetch("/api/ingestion", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ source }),
            });
            
            if (!response.ok) throw new Error("Sync failed");
            
            const data = await response.json();
            const newCount = data.result?.totalNew || 0;
            const updatedCount = data.result?.totalUpdated || 0;
            
            setSyncStatus(prev => ({ 
                ...prev, 
                [source]: `Complete: ${newCount} new, ${updatedCount} updated` 
            }));
        } catch (error) {
            console.error(error);
            setSyncStatus(prev => ({ ...prev, [source]: "Failed to sync" }));
        } finally {
            setIsSyncing(prev => ({ ...prev, [source]: false }));
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Manage your district profile and data sources
                </p>
            </div>

            <div className="grid gap-6">
                {/* Data Management Section */}
                <Card className="bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Database className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Data Management</CardTitle>
                        </div>
                        <CardDescription>
                            Manually trigger data synchronization from external grant sources. 
                            Use this if the grant catalog appears incomplete or outdated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div>
                                <div className="font-medium">Grants.gov (Federal)</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {syncStatus["grants_gov"] || "Ready to sync"}
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSync("grants_gov")}
                                disabled={isSyncing["grants_gov"]}
                            >
                                {isSyncing["grants_gov"] ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Sync Now
                            </Button>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                            <div>
                                <div className="font-medium">California Grants Portal</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {syncStatus["ca_grants"] || "Ready to sync"}
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleSync("ca_grants")}
                                disabled={isSyncing["ca_grants"]}
                            >
                                {isSyncing["ca_grants"] ? (
                                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                )}
                                Sync Now
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Organization Details */}
                <Card className="bg-card text-card-foreground">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Organization Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">District Name *</label>
                            <Input defaultValue="Lincoln Unified School District" placeholder="Lincoln Unified School District" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">UEI Number *</label>
                            <Input defaultValue="KJTM2NXQL7H5" placeholder="XXXXXXXXXX" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">EIN / Tax ID *</label>
                            <Input defaultValue="94-6000523" placeholder="XX-XXXXXXX" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Congressional District</label>
                            <Input defaultValue="CA-09" placeholder="CA-12" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Street Address</label>
                            <Input defaultValue="2010 W Swain Rd" placeholder="123 Education Blvd" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">City</label>
                            <Input defaultValue="Stockton" placeholder="Sacramento" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">State</label>
                                <Input defaultValue="CA" placeholder="CA" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ZIP Code</label>
                                <Input defaultValue="95207" placeholder="95814" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Demographics */}
                <Card className="bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Student Demographics</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Total Enrollment *</label>
                            <Input type="number" defaultValue={42500} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Free/Reduced Lunch (%)</label>
                            <Input type="number" defaultValue={72} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ELL Students (%)</label>
                            <Input type="number" defaultValue={28} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Special Education (%)</label>
                            <Input type="number" defaultValue={12} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Graduation Rate (%)</label>
                            <Input type="number" defaultValue={84} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Title I Status</label>
                            <Select defaultValue="schoolwide">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="schoolwide">Schoolwide Program</SelectItem>
                                    <SelectItem value="targeted">Targeted Assistance</SelectItem>
                                    <SelectItem value="none">Not Title I</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Information */}
                <Card className="bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Financial Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Annual Operating Budget</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                                <Input type="text" defaultValue="285,000,000" className="pl-7" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Indirect Cost Rate (%)</label>
                            <Input type="number" step="0.01" defaultValue={8.72} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Fiscal Year Start</label>
                            <Input type="date" defaultValue="2025-07-01" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Last Audit Status</label>
                            <Select defaultValue="clean">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="clean">Clean (No Findings)</SelectItem>
                                    <SelectItem value="minor">Minor Findings</SelectItem>
                                    <SelectItem value="material">Material Weakness</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Contacts */}
                <Card className="bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Key Contacts</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Superintendent Name</label>
                                <Input defaultValue="Dr. Maria Santos" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                <Input type="email" defaultValue="msantos@lincolnusd.org" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Phone</label>
                                <Input type="tel" defaultValue="(209) 953-8700" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Business Manager / CFO</label>
                                <Input defaultValue="Robert Chen" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                <Input type="email" defaultValue="rchen@lincolnusd.org" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance Certifications */}
                <Card className="bg-card">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Compliance Certifications</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "SAM.gov Registration Active",
                            "Single Audit Compliant",
                            "Civil Rights Assurances Filed",
                            "Drug-Free Workplace Certified"
                        ].map((label) => (
                            <div key={label} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 border-border">
                                <Checkbox id={label.replace(/\s/g, '')} defaultChecked />
                                <label htmlFor={label.replace(/\s/g, '')} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">{label}</label>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* AI Profile Auto-Fill Section (Moved to bottom) */}
                <Card className="border-primary/20 bg-card border-border">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg font-semibold text-foreground">AI Profile Auto-Fill</CardTitle>
                                </div>
                                <CardDescription className="text-muted-foreground">Upload district documents and let AI extract your profile data</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Recommended Documents */}
                        <div className="mb-6">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                                Recommended Documents to Upload
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { name: "LCAP", color: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800" },
                                    { name: "SARC", color: "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800" },
                                    { name: "Annual Budget", color: "bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800" },
                                    { name: "SAM.gov Reg", color: "bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800" },
                                    { name: "Single Audit", color: "bg-red-500/10 text-red-600 border-red-200 dark:text-red-400 dark:border-red-800" },
                                    { name: "Title I App", color: "bg-teal-500/10 text-teal-600 border-teal-200 dark:text-teal-400 dark:border-teal-800" },
                                    { name: "Demographics", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800" },
                                ].map((doc) => (
                                    <span key={doc.name} className={cn(
                                        "inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors cursor-default",
                                        doc.color
                                    )}>
                                        <FileText className="w-3.5 h-3.5 opacity-70" />
                                        {doc.name}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Drag and Drop Zone */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer bg-muted/50 hover:bg-muted",
                                isDragging
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-primary/50"
                            )}
                        >
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-colors text-muted-foreground", isDragging && "text-primary")} />
                            <p className="text-sm font-medium text-foreground mb-1">
                                Drag & drop documents here, or click to browse
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Supports: Annual Reports, Budget Documents, SAM.gov Registration, Demographics Reports, Audit Reports
                            </p>
                        </div>

                        {/* Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{file.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="hover:text-destructive">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    onClick={handleExtract}
                                    disabled={isExtracting}
                                    className="w-full mt-3 gap-2"
                                    variant="default"
                                >
                                    {isExtracting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Extracting with AI...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            Extract Profile Data
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Grant Autofilling Section */}
                <Card className="border-primary/20 bg-card border-border">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-lg text-primary">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg font-semibold text-foreground">AI Grant Autofilling</CardTitle>
                                    <Badge variant="secondary" className="text-xs font-normal bg-muted text-muted-foreground">Coming Soon</Badge>
                                </div>
                                <CardDescription className="text-muted-foreground">Select which application components to automatically generate using AI</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-0 pb-6">
                        {[
                            "Narrative & Descriptions",
                            "Budget Justifications",
                            "Performance Metrics",
                            "Project Timelines",
                            "Compliance Assurances",
                            "Staff Biographies"
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-3 p-3 border rounded-lg cursor-not-allowed opacity-60 bg-muted/50 border-border">
                                <Checkbox id={`grant-${feature}`} disabled />
                                <label htmlFor={`grant-${feature}`} className="text-sm font-medium leading-none cursor-not-allowed text-muted-foreground">{feature}</label>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pb-8">
                    <Button variant="ghost" className="data-[theme=royal]:text-white data-[theme=royal]:hover:bg-white/10">Cancel</Button>
                    <Button variant="default" className="data-[theme=royal]:bg-royal-gold data-[theme=royal]:text-white data-[theme=royal]:hover:bg-royal-gold/90">Save Profile</Button>
                </div>
            </div>
        </div>
    );
}