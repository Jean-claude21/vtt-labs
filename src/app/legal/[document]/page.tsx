'use client';

import React from 'react';
import LegalDocumentViewer from '@/features/legal/components/legal-document-viewer';

interface LegalPageProps {
    document: string;
    lng: string;
}

interface LegalPageParams {
    params: Promise<LegalPageProps>
}

export default function LegalPage({ params }: Readonly<LegalPageParams>) {
    const {document} = React.use<LegalPageProps>(params);

    return <LegalDocumentViewer documentSlug={document} />;
}