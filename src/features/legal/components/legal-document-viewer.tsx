'use client';

import React from 'react';
import LegalDocument from '@/features/legal/components/legal-document';
import { notFound } from 'next/navigation';

const legalDocuments = {
    'privacy': {
        title: 'Privacy Notice',
        path: '/terms/privacy-notice.md'
    },
    'terms': {
        title: 'Terms of Service',
        path: '/terms/terms-of-service.md'
    },
    'refund': {
        title: 'Refund Policy',
        path: '/terms/refund-policy.md'
    }
} as const;

type LegalDocumentKey = keyof typeof legalDocuments;

interface LegalDocumentViewerProps {
    documentSlug: string;
}

export default function LegalDocumentViewer({ documentSlug }: LegalDocumentViewerProps) {
    const docKey = documentSlug as LegalDocumentKey;

    if (!legalDocuments[docKey]) {
        notFound();
    }

    const { title, path } = legalDocuments[docKey];

    return (
        <div className="container mx-auto px-4 py-8">
            <LegalDocument
                title={title}
                filePath={path}
            />
        </div>
    );
}
