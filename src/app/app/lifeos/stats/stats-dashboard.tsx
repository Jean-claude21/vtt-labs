/**
 * LifeOS Statistics Dashboard Component
 * 
 * @module app/lifeos/stats
 */
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Clock,
  Flame,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import type { OverviewStats, WeeklyStats, StreakInfo } from '@/features/lifeos/services/analytics.service';

interface StatsDashboardProps {
  initialOverview: OverviewStats | null;
  initialWeeklyStats: WeeklyStats | null;
  initialStreaks: StreakInfo[];
  error: string | null;
}

// Format minutes to hours and minutes
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function StatsDashboard({ 
  initialOverview, 
  initialWeeklyStats, 
  initialStreaks,
  error,
}: Readonly<StatsDashboardProps>) {
  const overview = initialOverview;
  const weeklyStats = initialWeeklyStats;
  const streaks = initialStreaks;

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiques</h1>
        <p className="text-muted-foreground">
          Suivez votre progression et vos habitudes.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taux de complétion
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.weeklyCompletionRate ?? 0}%
            </div>
            <Progress 
              value={overview?.weeklyCompletionRate ?? 0} 
              className="h-2 mt-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              Routines complétées cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meilleur streak
            </CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.currentBestStreak ?? 0} jours
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Record: {overview?.longestStreak ?? 0} jours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tâches terminées
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {weeklyStats?.tasksCompleted ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Temps total
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(weeklyStats?.totalTimeMinutes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Temps tracké cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Time by Domain */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Temps par domaine
            </CardTitle>
            <CardDescription>
              Répartition du temps cette semaine
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyStats?.byDomain && weeklyStats.byDomain.length > 0 ? (
              <div className="space-y-4">
                {weeklyStats.byDomain.map((domain) => (
                  <div key={domain.domainId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: domain.domainColor }}
                        />
                        <span className="text-sm font-medium">{domain.domainName}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatTime(domain.timeMinutes)}
                      </span>
                    </div>
                    <Progress 
                      value={weeklyStats.totalTimeMinutes > 0 
                        ? (domain.timeMinutes / weeklyStats.totalTimeMinutes) * 100 
                        : 0
                      } 
                      className="h-2"
                    />
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{domain.routinesCompleted}/{domain.routinesTotal} routines</span>
                      <span>{domain.tasksCompleted} tâches</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Aucune donnée cette semaine
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activité par jour
            </CardTitle>
            <CardDescription>
              Cette semaine jour par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyStats?.byDay && weeklyStats.byDay.length > 0 ? (
              <div className="grid grid-cols-7 gap-2">
                {weeklyStats.byDay.map((day) => {
                  const total = day.routinesTotal + day.tasksCompleted;
                  const completed = day.routinesCompleted + day.tasksCompleted;
                  const intensity = total > 0 ? completed / Math.max(total, 5) : 0;
                  
                  return (
                    <div 
                      key={day.date} 
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="text-xs text-muted-foreground capitalize">
                        {day.dayName}
                      </span>
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium border"
                        style={{
                          backgroundColor: intensity > 0 
                            ? `hsl(var(--primary) / ${Math.max(intensity * 100, 20)}%)` 
                            : 'transparent',
                          color: intensity > 0.5 ? 'white' : 'inherit',
                        }}
                      >
                        {completed}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(day.timeMinutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  Aucune donnée cette semaine
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Streaks Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Streaks actifs
          </CardTitle>
          <CardDescription>
            Vos séries de jours consécutifs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {streaks.length > 0 ? (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {streaks.map((streak) => (
                  <div 
                    key={streak.routineId}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{streak.routineName}</p>
                      {streak.lastCompletedDate && (
                        <p className="text-xs text-muted-foreground">
                          Dernière complétion: {new Date(streak.lastCompletedDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Flame className={`h-4 w-4 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                          <span className="font-bold">{streak.currentStreak}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">actuel</span>
                      </div>
                      <Badge variant="secondary">
                        Record: {streak.longestStreak}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune routine trackée pour l&apos;instant.</p>
              <p className="text-sm">Complétez des routines pour voir vos streaks ici.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
