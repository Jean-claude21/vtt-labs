/**
 * LifeOS Settings Dashboard Component
 * 
 * @module app/lifeos/settings
 */
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Settings, Bell, Shield } from 'lucide-react';
import { DomainsList } from '@/features/lifeos/components/domains/domains-list';
import { 
  createDomain, 
  updateDomain, 
  deleteDomain, 
  reorderDomains 
} from '@/features/lifeos/actions/domains.actions';
import type { Domain, CreateDomainInput } from '@/features/lifeos/schema/domains.schema';

interface SettingsDashboardProps {
  initialDomains: Domain[];
  error: string | null;
}

export function SettingsDashboard({ initialDomains, error }: Readonly<SettingsDashboardProps>) {
  const router = useRouter();
  const [domains, setDomains] = React.useState<Domain[]>(initialDomains);

  if (error) {
    return (
      <div className="container py-6">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <p className="text-destructive">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  const handleCreateDomain = async (data: CreateDomainInput) => {
    const result = await createDomain(data);
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    if (result.data) {
      setDomains(prev => [...prev, result.data!]);
      toast.success('Domaine créé', { description: `${data.name} a été ajouté` });
      router.refresh();
    }
  };

  const handleUpdateDomain = async (id: string, data: CreateDomainInput) => {
    const result = await updateDomain({ id, ...data });
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    if (result.data) {
      setDomains(prev => prev.map(d => d.id === id ? result.data! : d));
      toast.success('Domaine mis à jour', { description: `${data.name} a été modifié` });
      router.refresh();
    }
  };

  const handleDeleteDomain = async (id: string) => {
    const result = await deleteDomain(id);
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    setDomains(prev => prev.filter(d => d.id !== id));
    toast.success('Domaine supprimé');
    router.refresh();
  };

  const handleReorderDomains = async (orderedIds: string[]) => {
    const result = await reorderDomains(orderedIds);
    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }
    if (result.data) {
      setDomains(result.data);
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuration LifeOS</h1>
        <p className="text-muted-foreground">
          Gérez vos domaines de vie, préférences et paramètres du module Planning.
        </p>
      </div>

      <Tabs defaultValue="domains" className="space-y-4">
        <TabsList>
          <TabsTrigger value="domains" className="gap-2">
            <Palette className="h-4 w-4" />
            <span>Domaines</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>Préférences</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Shield className="h-4 w-4" />
            <span>Données</span>
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Domaines de vie</CardTitle>
              <CardDescription>
                Les domaines organisent vos routines, tâches et projets par grandes catégories de vie.
                Chaque domaine a une couleur et un emoji pour une identification visuelle rapide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainsList
                domains={domains}
                onCreateDomain={handleCreateDomain}
                onUpdateDomain={handleUpdateDomain}
                onDeleteDomain={handleDeleteDomain}
                onReorderDomains={handleReorderDomains}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Préférences du calendrier</CardTitle>
              <CardDescription>
                Personnalisez l&apos;affichage et le comportement du calendrier.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Configuration des préférences à venir...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Gérez vos rappels et notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Configuration des notifications à venir...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des données</CardTitle>
              <CardDescription>
                Export, import et maintenance de vos données.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Options de gestion des données à venir...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
