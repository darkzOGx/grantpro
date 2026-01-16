"use client";

import { useState, useCallback } from "react";
import { Upload, FileText, X, Sparkles, Building2, Users, DollarSign, Phone, FileCheck } from "lucide-react";
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

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground data-[theme=royal]:text-white">Settings</h1>
                <p className="text-muted-foreground data-[theme=royal]:text-white/70 mt-1">
                    Manage your district profile for grant auto-fill
                </p>
            </div>

            {/* Document Upload Section */}
            <Card className="border-primary/20 bg-primary/5 data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg data-[theme=royal]:bg-royal-gold/20">
                            <Sparkles className="w-5 h-5 text-primary data-[theme=royal]:text-royal-gold" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-semibold data-[theme=royal]:text-white">AI Profile Auto-Fill</CardTitle>
                            <CardDescription className="data-[theme=royal]:text-white/60">Upload district documents and let AI extract your profile data</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Recommended Documents */}
                    <div className="mb-6">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 data-[theme=royal]:text-white/50">
                            Recommended Documents to Upload
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { name: "LCAP", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
                                { name: "SARC", color: "bg-green-500/10 text-green-600 border-green-200" },
                                { name: "Annual Budget", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
                                { name: "SAM.gov Reg", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
                                { name: "Single Audit", color: "bg-red-500/10 text-red-600 border-red-200" },
                                { name: "Title I App", color: "bg-teal-500/10 text-teal-600 border-teal-200" },
                                { name: "Demographics", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
                            ].map((doc) => (
                                <span key={doc.name} className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-xs font-medium transition-colors cursor-default",
                                    "bg-background text-foreground hover:bg-muted", // Default theme
                                    "data-[theme=royal]:bg-white/5 data-[theme=royal]:text-white/90 data-[theme=royal]:border-white/10 data-[theme=royal]:hover:bg-white/10" // Royal override
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
                            "relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
                            isDragging
                                ? "border-primary bg-primary/10"
                                : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 data-[theme=royal]:hover:bg-white/5"
                        )}
                    >
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className={cn("w-10 h-10 mx-auto mb-3 transition-colors", isDragging ? "text-primary" : "text-muted-foreground")} />
                        <p className="text-sm font-medium text-foreground mb-1 data-[theme=royal]:text-white">
                            Drag & drop documents here, or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground data-[theme=royal]:text-white/50">
                            Supports: Annual Reports, Budget Documents, SAM.gov Registration, Demographics Reports, Audit Reports
                        </p>
                    </div>

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {uploadedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-card rounded-lg border animate-in fade-in slide-in-from-left-2 data-[theme=royal]:bg-white/10 data-[theme=royal]:border-white/10"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium text-foreground data-[theme=royal]:text-white">{file.name}</p>
                                            <p className="text-xs text-muted-foreground data-[theme=royal]:text-white/60">
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
                                variant="royal"
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

            {/* Manual Profile Form */}
            <div className="grid gap-6">
                {/* Organization Details */}
                <Card className="data-[theme=royal]:bg-white/5 data-[theme=royal]:border-white/10 text-card-foreground">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-muted-foreground data-[theme=royal]:text-royal-gold" />
                            <CardTitle className="text-lg data-[theme=royal]:text-white">Organization Details</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">District Name *</label>
                            <Input defaultValue="Lincoln Unified School District" placeholder="Lincoln Unified School District" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">UEI Number *</label>
                            <Input defaultValue="KJTM2NXQL7H5" placeholder="XXXXXXXXXX" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">EIN / Tax ID *</label>
                            <Input defaultValue="94-6000523" placeholder="XX-XXXXXXX" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Congressional District</label>
                            <Input defaultValue="CA-09" placeholder="CA-12" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Street Address</label>
                            <Input defaultValue="2010 W Swain Rd" placeholder="123 Education Blvd" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">City</label>
                            <Input defaultValue="Stockton" placeholder="Sacramento" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">State</label>
                                <Input defaultValue="CA" placeholder="CA" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">ZIP Code</label>
                                <Input defaultValue="95207" placeholder="95814" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Demographics */}
                <Card className="data-[theme=royal]:bg-white/5 data-[theme=royal]:border-white/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-muted-foreground data-[theme=royal]:text-royal-gold" />
                            <CardTitle className="text-lg data-[theme=royal]:text-white">Student Demographics</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Total Enrollment *</label>
                            <Input type="number" defaultValue={42500} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Free/Reduced Lunch (%)</label>
                            <Input type="number" defaultValue={72} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">ELL Students (%)</label>
                            <Input type="number" defaultValue={28} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Special Education (%)</label>
                            <Input type="number" defaultValue={12} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Graduation Rate (%)</label>
                            <Input type="number" defaultValue={84} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Title I Status</label>
                            <Select defaultValue="schoolwide">
                                <SelectTrigger className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
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
                <Card className="data-[theme=royal]:bg-white/5 data-[theme=royal]:border-white/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-muted-foreground data-[theme=royal]:text-royal-gold" />
                            <CardTitle className="text-lg data-[theme=royal]:text-white">Financial Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Annual Operating Budget</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground data-[theme=royal]:text-white/50">$</span>
                                <Input type="text" defaultValue="285,000,000" className="pl-7 data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Indirect Cost Rate (%)</label>
                            <Input type="number" step="0.01" defaultValue={8.72} className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Fiscal Year Start</label>
                            <Input type="date" defaultValue="2025-07-01" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Last Audit Status</label>
                            <Select defaultValue="clean">
                                <SelectTrigger className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20">
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
                <Card className="data-[theme=royal]:bg-white/5 data-[theme=royal]:border-white/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-muted-foreground data-[theme=royal]:text-royal-gold" />
                            <CardTitle className="text-lg data-[theme=royal]:text-white">Key Contacts</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Superintendent Name</label>
                                <Input defaultValue="Dr. Maria Santos" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Email</label>
                                <Input type="email" defaultValue="msantos@lincolnusd.org" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Phone</label>
                                <Input type="tel" defaultValue="(209) 953-8700" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Business Manager / CFO</label>
                                <Input defaultValue="Robert Chen" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[theme=royal]:text-white/90">Email</label>
                                <Input type="email" defaultValue="rchen@lincolnusd.org" className="data-[theme=royal]:bg-white/10 data-[theme=royal]:text-white data-[theme=royal]:border-white/20" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Compliance Certifications */}
                <Card className="data-[theme=royal]:bg-white/5 data-[theme=royal]:border-white/10">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-muted-foreground data-[theme=royal]:text-royal-gold" />
                            <CardTitle className="text-lg data-[theme=royal]:text-white">Compliance Certifications</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            "SAM.gov Registration Active",
                            "Single Audit Compliant",
                            "Civil Rights Assurances Filed",
                            "Drug-Free Workplace Certified"
                        ].map((label) => (
                            <div key={label} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 data-[theme=royal]:border-white/10 data-[theme=royal]:hover:bg-white/5">
                                <Checkbox id={label.replace(/\s/g, '')} defaultChecked />
                                <label htmlFor={label.replace(/\s/g, '')} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer data-[theme=royal]:text-white/90">{label}</label>
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
