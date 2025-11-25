'use client';
import React from "react";
import {FileText, RefreshCw, Shield} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type LegalDocumentsParams = {
    minimalist: boolean;
}

export default function LegalDocuments({ minimalist }: LegalDocumentsParams) {
    if (minimalist) {
        return (
            <>
                <div className="mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary"/>
                    <span className="text-sm font-medium">Legal Documents</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <Button variant="ghost" asChild className="h-auto py-2 px-3 justify-start">
                        <Link href="/legal/privacy">
                            <span className="text-sm text-muted-foreground hover:text-primary">Privacy Policy</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild className="h-auto py-2 px-3 justify-start">
                        <Link href="/legal/terms">
                            <span className="text-sm text-muted-foreground hover:text-primary">Terms of Service</span>
                        </Link>
                    </Button>
                    <Button variant="ghost" asChild className="h-auto py-2 px-3 justify-start">
                        <Link href="/legal/refund">
                            <span className="text-sm text-muted-foreground hover:text-primary">Refund Policy</span>
                        </Link>
                    </Button>
                </div>
            </>
        )
    }
    return (
        <>
            <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary"/>
                <span className="text-base font-medium">Legal Documents</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" asChild className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5">
                    <Link href="/legal/privacy" className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-muted-foreground group-hover:text-primary"/>
                        <span className="text-sm text-muted-foreground group-hover:text-primary">Privacy Policy</span>
                    </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5">
                    <Link href="/legal/terms" className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary"/>
                        <span className="text-sm text-muted-foreground group-hover:text-primary">Terms of Service</span>
                    </Link>
                </Button>
                <Button variant="outline" asChild className="h-auto py-4 justify-start group hover:border-primary hover:bg-primary/5">
                    <Link href="/legal/refund" className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-muted-foreground group-hover:text-primary"/>
                        <span className="text-sm text-muted-foreground group-hover:text-primary">Refund Policy</span>
                    </Link>
                </Button>
            </div>
        </>
    )
}