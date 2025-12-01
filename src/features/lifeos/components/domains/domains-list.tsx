/**
 * Domains List Component
 * 
 * Displays all domains with drag-and-drop reordering capability.
 * 
 * @module lifeos/components/domains/domains-list
 */

'use client';

import { useState, useCallback } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DomainCard } from './domain-card';
import { DomainForm } from './domain-form';
import type { Domain, CreateDomainInput } from '../../schema/domains.schema';

interface DomainsListProps {
  domains: Domain[];
  onCreateDomain: (data: CreateDomainInput) => Promise<void>;
  onUpdateDomain: (id: string, data: CreateDomainInput) => Promise<void>;
  onDeleteDomain: (id: string) => Promise<void>;
  onReorderDomains: (orderedIds: string[]) => Promise<void>;
}

export function DomainsList({
  domains,
  onCreateDomain,
  onUpdateDomain,
  onDeleteDomain,
  onReorderDomains,
}: DomainsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleEdit = useCallback((domain: Domain) => {
    setEditingDomain(domain);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback(async (domain: Domain) => {
    await onDeleteDomain(domain.id);
  }, [onDeleteDomain]);

  const handleFormSubmit = useCallback(async (data: CreateDomainInput) => {
    if (editingDomain) {
      await onUpdateDomain(editingDomain.id, data);
    } else {
      await onCreateDomain(data);
    }
    setEditingDomain(null);
  }, [editingDomain, onCreateDomain, onUpdateDomain]);

  const handleFormClose = useCallback((open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setEditingDomain(null);
    }
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragEnd = useCallback(async () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...domains];
      const [draggedItem] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dragOverIndex, 0, draggedItem);
      
      await onReorderDomains(newOrder.map(d => d.id));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, domains, onReorderDomains]);

  // Empty state
  if (domains.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FolderOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">No domains yet</h3>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          Create your first domain to start organizing your life activities.
          Domains help you categorize routines, tasks, and track time across different areas.
        </p>
        <Button onClick={() => setIsFormOpen(true)} className="mt-6">
          <Plus className="mr-2 h-4 w-4" />
          Create Domain
        </Button>

        <DomainForm
          open={isFormOpen}
          onOpenChange={handleFormClose}
          domain={editingDomain}
          onSubmit={handleFormSubmit}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {domains.length} domain{domains.length !== 1 ? 's' : ''} • Drag to reorder
        </p>
        <Button onClick={() => setIsFormOpen(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      {/* Domains grid */}
      <div className="grid gap-3">
        {domains.map((domain, index) => (
          <div
            key={domain.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              transition-all duration-200
              ${dragOverIndex === index && draggedIndex !== index 
                ? 'translate-y-2 border-t-2 border-primary' 
                : ''}
            `}
          >
            <DomainCard
              domain={domain}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isDragging={draggedIndex === index}
              dragHandleProps={{
                onMouseDown: () => {},
              }}
            />
          </div>
        ))}
      </div>

      {/* Form dialog */}
      <DomainForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        domain={editingDomain}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
