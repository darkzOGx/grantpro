import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrantWithScore, CATEGORY_LABELS } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Calendar, DollarSign, Building2, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface GrantDetailsModalProps {
    grant: GrantWithScore | null;
    isOpen: boolean;
    onClose: () => void;
}

export function GrantDetailsModal({ grant, isOpen, onClose }: GrantDetailsModalProps) {
    if (!grant) return null;

    const daysUntilDeadline = grant.deadline 
        ? Math.ceil((new Date(grant.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const isUrgent = daysUntilDeadline <= 14 && daysUntilDeadline > 0;
    const isPastDue = daysUntilDeadline < 0;

    // Helper to format description text into paragraphs
    const renderDescription = (text: string | null) => {
        if (!text) return null;
        
        // If text has explicit newlines, use them
        if (text.includes('\n')) {
            return text.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="mb-4 last:mb-0">{para.trim()}</p>
            ));
        }

        // Otherwise, try to split long text into paragraphs by sentences
        // Heuristic: Split approximately every 3-4 sentences
        const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
        const paragraphs: string[] = [];
        let currentPara = "";
        
        sentences.forEach((sentence, i) => {
            currentPara += sentence;
            // Start new paragraph every 3 sentences, or if paragraph is getting very long
            if ((i + 1) % 3 === 0 || currentPara.length > 400) {
                paragraphs.push(currentPara);
                currentPara = "";
            }
        });
        if (currentPara) paragraphs.push(currentPara);

        return paragraphs.map((para, i) => (
            <p key={i} className="mb-4 last:mb-0">{para.trim()}</p>
        ));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs font-normal">
                                    {CATEGORY_LABELS[grant.category] || grant.category}
                                </Badge>
                                {grant.matchScore && (
                                    <Badge 
                                        variant="secondary" 
                                        className={`text-xs font-normal ${
                                            grant.matchScore >= 90 ? 'bg-green-100 text-green-700' :
                                            grant.matchScore >= 75 ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}
                                    >
                                        {grant.matchScore}% Match
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-2xl font-bold leading-tight">
                                {grant.title}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-2 text-sm mt-1.5">
                                <span className="font-medium text-foreground">{grant.agencyCode || grant.sourceType}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">ID: {grant.externalId || grant.id}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    <div className="space-y-8 pb-8">
                        {/* Key Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y bg-muted/30 -mx-6 px-6">
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5" />
                                    Award Amount
                                </div>
                                <div className="font-semibold text-sm">
                                    {grant.fundingAmountMax ? formatCurrency(grant.fundingAmountMax) : "Variable"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Deadline
                                </div>
                                <div className={`font-semibold text-sm ${isUrgent ? 'text-orange-600' : isPastDue ? 'text-red-600' : ''}`}>
                                    {grant.deadline ? formatDate(grant.deadline) : "Open"}
                                </div>
                            </div>
                             <div className="space-y-1">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    Status
                                </div>
                                <div className="font-semibold text-sm">
                                    {isPastDue ? "Closed" : "Active"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Agency
                                </div>
                                <div className="font-semibold text-sm truncate" title={grant.agencyCode || grant.sourceType}>
                                    {grant.agencyCode || grant.sourceType}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Description
                            </h3>
                            <div className="text-sm text-foreground/80 leading-relaxed text-justify">
                                {renderDescription(grant.description)}
                            </div>
                        </div>

                        {/* Eligibility & Requirements (Mocked if not present) */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Requirements & Eligibility
                            </h3>
                            <ul className="space-y-2">
                                <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <span>Must be a registered K-12 school district or educational institution.</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <span>Project must directly benefit student learning outcomes or school infrastructure.</span>
                                </li>
                                <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    <span>Compliance with federal non-discrimination policies.</span>
                                </li>
                            </ul>
                        </div>

                         {/* Deliverables (Mocked) */}
                         <div className="space-y-3">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Key Deliverables
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 border rounded-lg bg-card flex items-start gap-3">
                                    <div className="p-1.5 bg-blue-100 text-blue-700 rounded-md shrink-0">
                                        <AlertCircle className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Quarterly Reports</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Progress updates on project milestones and budget usage.</div>
                                    </div>
                                </div>
                                <div className="p-3 border rounded-lg bg-card flex items-start gap-3">
                                    <div className="p-1.5 bg-purple-100 text-purple-700 rounded-md shrink-0">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-sm">Final Impact Assessment</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">Comprehensive review of program outcomes and student benefits.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t bg-muted/10 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
                        Close
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto" asChild>
                            <a href={grant.applicationUrl || grant.sourceUrl || "#"} target="_blank" rel="noopener noreferrer">
                                Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}