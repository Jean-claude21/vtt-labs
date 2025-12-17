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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Palette, Settings, Bell, Shield, Loader2, Clock, CalendarClock } from 'lucide-react';
import { DomainsList } from '@/features/lifeos/components/domains/domains-list';
import { 
  createDomain, 
  updateDomain, 
  deleteDomain, 
  reorderDomains 
} from '@/features/lifeos/actions/domains.actions';
import { updatePreferences } from '@/features/lifeos/actions/preferences.actions';
import type { Domain, CreateDomainInput } from '@/features/lifeos/schema/domains.schema';
import type { UserPreferences, TimeBlocks } from '@/features/lifeos/schema/preferences.schema';

interface SettingsDashboardProps {
  initialDomains: Domain[];
  initialPreferences: UserPreferences | null;
  error: string | null;
}

export function SettingsDashboard({ initialDomains, initialPreferences, error }: Readonly<SettingsDashboardProps>) {
  const router = useRouter();
  const [domains, setDomains] = React.useState<Domain[]>(initialDomains);
  const [preferences, setPreferences] = React.useState<UserPreferences | null>(initialPreferences);
  const [isSaving, setIsSaving] = React.useState(false);

  // Time blocks state
  const [timeBlocks, setTimeBlocks] = React.useState<TimeBlocks>(
    preferences?.time_blocks ?? {
      morning: { start: '06:00', end: '12:00' },
      noon: { start: '12:00', end: '14:00' },
      afternoon: { start: '14:00', end: '18:00' },
      evening: { start: '18:00', end: '21:00' },
      night: { start: '21:00', end: '23:59' },
    }
  );

  // Auto-positioning state
  const [autoPositionRoutines, setAutoPositionRoutines] = React.useState(
    preferences?.auto_position_routines ?? true
  );
  const [autoPositionTasks, setAutoPositionTasks] = React.useState(
    preferences?.auto_position_tasks ?? false
  );

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

  // Update time block
  const handleTimeBlockChange = (
    moment: keyof TimeBlocks,
    field: 'start' | 'end',
    value: string
  ) => {
    setTimeBlocks((prev) => ({
      ...prev,
      [moment]: { ...prev[moment], [field]: value },
    }));
  };

  // Save preferences
  const handleSavePreferences = async () => {
    setIsSaving(true);
    const result = await updatePreferences({
      time_blocks: timeBlocks,
      auto_position_routines: autoPositionRoutines,
      auto_position_tasks: autoPositionTasks,
    });
    setIsSaving(false);

    if (result.error) {
      toast.error('Erreur', { description: result.error });
      return;
    }

    if (result.data) {
      setPreferences(result.data);
      toast.success('Préférences sauvegardées');
    }
  };

  // Time block labels
  const timeBlockLabels: Record<keyof TimeBlocks, { label: string; emoji: string }> = {
    morning: { label: 'Matin', emoji: '🌅' },
    noon: { label: 'Midi', emoji: '☀️' },
    afternoon: { label: 'Après-midi', emoji: '🌤️' },
    evening: { label: 'Soir', emoji: '🌆' },
    night: { label: 'Nuit', emoji: '🌙' },
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
          {/* Auto-positioning Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="h-5 w-5" />
                Positionnement automatique
              </CardTitle>
              <CardDescription>
                Choisissez si les routines et tâches doivent être automatiquement positionnées 
                dans le calendrier en fonction de leurs contraintes horaires ou catégorie de moment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-position-routines" className="font-medium">
                    Routines
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Positionner automatiquement les routines selon leurs contraintes horaires
                  </p>
                </div>
                <Switch
                  id="auto-position-routines"
                  checked={autoPositionRoutines}
                  onCheckedChange={setAutoPositionRoutines}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-position-tasks" className="font-medium">
                    Tâches
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Positionner automatiquement les tâches (sinon elles restent &quot;À planifier&quot;)
                  </p>
                </div>
                <Switch
                  id="auto-position-tasks"
                  checked={autoPositionTasks}
                  onCheckedChange={setAutoPositionTasks}
                />
              </div>
            </CardContent>
          </Card>

          {/* Time Blocks Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Plages horaires
              </CardTitle>
              <CardDescription>
                Définissez les plages horaires pour chaque moment de la journée.
                Ces horaires sont utilisés pour positionner automatiquement les routines 
                ayant une catégorie de moment (matin, midi, après-midi, soir, nuit).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.keys(timeBlockLabels) as Array<keyof TimeBlocks>).map((moment) => (
                <div key={moment} className="flex items-center gap-4">
                  <div className="w-32 flex items-center gap-2">
                    <span>{timeBlockLabels[moment].emoji}</span>
                    <Label className="font-medium">{timeBlockLabels[moment].label}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={timeBlocks[moment].start}
                      onChange={(e) => handleTimeBlockChange(moment, 'start', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-muted-foreground">à</span>
                    <Input
                      type="time"
                      value={timeBlocks[moment].end}
                      onChange={(e) => handleTimeBlockChange(moment, 'end', e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSavePreferences} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sauvegarder les préférences
            </Button>
          </div>
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
