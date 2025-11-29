'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function LegalHome() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    Select document on the left.
                </CardContent>
            </Card>
        </div>
    );
}
