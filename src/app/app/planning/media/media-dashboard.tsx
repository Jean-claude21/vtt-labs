/**
 * LifeOS Media Dashboard Component
 * 
 * Gallery for tracking media with before/after comparison.
 * 
 * @module app/lifeos/media
 */
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image as ImageIcon, 
  Grid3X3, 
  Rows3,
  Calendar,
  Upload,
} from 'lucide-react';
import type { TrackingMedia } from '@/features/lifeos/schema/media.schema';
import type { Domain } from '@/features/lifeos/schema/domains.schema';

interface MediaDashboardProps {
  initialMedia: Record<string, TrackingMedia[]>;
  domains: Domain[];
  error: string | null;
}

export function MediaDashboard({ initialMedia, domains, error }: Readonly<MediaDashboardProps>) {
  const [viewMode, setViewMode] = React.useState<'grid' | 'timeline'>('grid');
  const [selectedDomain, setSelectedDomain] = React.useState<string>('all');

  // Get domain name by ID
  const getDomainName = (domainId: string | null) => {
    if (!domainId) return 'Sans domaine';
    const domain = domains.find(d => d.id === domainId);
    return domain?.name || 'Inconnu';
  };

  // Get domain color by ID
  const getDomainColor = (domainId: string | null) => {
    if (!domainId) return '#6B7280';
    const domain = domains.find(d => d.id === domainId);
    return domain?.color || '#6B7280';
  };

  // Total media count
  const totalMedia = Object.values(initialMedia).flat().length;

  // Filtered media based on selected domain
  const filteredMedia = selectedDomain === 'all'
    ? Object.entries(initialMedia)
    : Object.entries(initialMedia).filter(([domainId]) => domainId === selectedDomain);

  if (error) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Médias de suivi</h1>
          <p className="text-muted-foreground">
            Capturez votre progression avec des photos avant/après.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('timeline')}
          >
            <Rows3 className="h-4 w-4" />
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Domain filter tabs */}
      <Tabs value={selectedDomain} onValueChange={(v) => setSelectedDomain(v)}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all" className="gap-2">
            Tous
            <Badge variant="secondary" className="ml-1">{totalMedia}</Badge>
          </TabsTrigger>
          {domains.map((domain) => {
            const count = initialMedia[domain.id]?.length || 0;
            if (count === 0) return null;
            return (
              <TabsTrigger key={domain.id} value={domain.id} className="gap-2">
                <span className="text-lg">{domain.icon}</span>
                {domain.name}
                <Badge variant="secondary" className="ml-1">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Content */}
      {totalMedia === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {filteredMedia.map(([domainId, mediaList]) => (
            <MediaSection
              key={domainId}
              domainName={getDomainName(domainId === 'no-domain' ? null : domainId)}
              domainColor={getDomainColor(domainId === 'no-domain' ? null : domainId)}
              media={mediaList}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center py-12">
      <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">Aucun média</h3>
      <p className="text-muted-foreground text-center max-w-sm mb-4">
        Ajoutez des photos pour suivre votre progression dans différents domaines de vie.
        Par exemple: transformation physique, projets créatifs, organisation...
      </p>
      <Button>
        <Upload className="h-4 w-4 mr-2" />
        Ajouter votre première photo
      </Button>
    </Card>
  );
}

function MediaSection({
  domainName,
  domainColor,
  media,
  viewMode,
}: Readonly<{
  domainName: string;
  domainColor: string;
  media: TrackingMedia[];
  viewMode: 'grid' | 'timeline';
}>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: domainColor }}
        />
        <h2 className="text-lg font-semibold">{domainName}</h2>
        <Badge variant="outline">{media.length} média(s)</Badge>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => (
            <MediaCard key={item.id} media={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {media.map((item) => (
            <MediaTimelineItem key={item.id} media={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function MediaCard({ media }: Readonly<{ media: TrackingMedia }>) {
  return (
    <div className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer">
      {/* Placeholder for image */}
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
        {media.caption && (
          <p className="text-sm text-center px-2 line-clamp-2">{media.caption}</p>
        )}
        <p className="text-xs text-white/70 mt-1">
          {new Date(media.created_at).toLocaleDateString('fr-FR')}
        </p>
      </div>
    </div>
  );
}

function MediaTimelineItem({ media }: Readonly<{ media: TrackingMedia }>) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {media.caption && (
            <p className="font-medium truncate">{media.caption}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {media.file_name}
          </p>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(media.created_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
