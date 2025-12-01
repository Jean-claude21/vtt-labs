/**
 * Domain Card Component
 * 
 * Displays a single domain with its icon, color, name, and actions.
 * 
 * @module lifeos/components/domains/domain-card
 */

'use client';

import { useState } from 'react';
import { MoreHorizontal, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Domain } from '../../schema/domains.schema';

interface DomainCardProps {
  domain: Domain;
  onEdit: (domain: Domain) => void;
  onDelete: (domain: Domain) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function DomainCard({ 
  domain, 
  onEdit, 
  onDelete,
  isDragging = false,
  dragHandleProps,
}: DomainCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <Card 
        className={`transition-all ${isDragging ? 'opacity-50 scale-105 shadow-lg' : ''}`}
        style={{ borderLeftColor: domain.color, borderLeftWidth: '4px' }}
      >
        <CardHeader className="flex flex-row items-center gap-3 py-3 px-4">
          {/* Drag handle */}
          {dragHandleProps && (
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-5 w-5" />
            </div>
          )}
          
          {/* Icon and name */}
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ backgroundColor: `${domain.color}20` }}
          >
            {domain.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{domain.name}</h3>
            {domain.vision && (
              <p className="text-sm text-muted-foreground truncate">
                {domain.vision}
              </p>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(domain)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        {/* Time targets if set */}
        {(domain.daily_target_minutes || domain.weekly_target_minutes) && (
          <CardContent className="pt-0 pb-3 px-4">
            <div className="flex gap-4 text-xs text-muted-foreground">
              {domain.daily_target_minutes && (
                <span>Daily: {Math.round(domain.daily_target_minutes / 60)}h</span>
              )}
              {domain.weekly_target_minutes && (
                <span>Weekly: {Math.round(domain.weekly_target_minutes / 60)}h</span>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{domain.name}&quot;? This action cannot be undone.
              {domain.is_default && (
                <span className="block mt-2 text-amber-600">
                  This is a default domain. You can recreate it by resetting to defaults.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(domain);
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
