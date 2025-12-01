/**
 * Domains Page Client Component
 * 
 * Client-side interactivity for domains management.
 * 
 * @module app/lifeos/domains/client
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { DomainsList } from '@/features/lifeos/components/domains/domains-list';
import { 
  createDomain, 
  updateDomain, 
  deleteDomain,
  reorderDomains,
  checkDomainLinkedItems,
} from '@/features/lifeos/actions/domains.actions';
import type { Domain, CreateDomainInput } from '@/features/lifeos/schema/domains.schema';

interface DomainsPageClientProps {
  initialDomains: Domain[];
}

export function DomainsPageClient({ initialDomains }: DomainsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [domains, setDomains] = useState<Domain[]>(initialDomains);

  const handleCreateDomain = async (data: CreateDomainInput) => {
    const result = await createDomain(data);
    
    if (result.error) {
      toast.error('Failed to create domain', {
        description: result.error,
      });
      return;
    }

    if (result.data) {
      setDomains(prev => [...prev, result.data!]);
      toast.success('Domain created', {
        description: `"${result.data.name}" has been created.`,
      });
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const handleUpdateDomain = async (id: string, data: CreateDomainInput) => {
    const result = await updateDomain({ id, ...data });
    
    if (result.error) {
      toast.error('Failed to update domain', {
        description: result.error,
      });
      return;
    }

    if (result.data) {
      setDomains(prev => prev.map(d => d.id === id ? result.data! : d));
      toast.success('Domain updated', {
        description: `"${result.data.name}" has been updated.`,
      });
    }

    startTransition(() => {
      router.refresh();
    });
  };

  const handleDeleteDomain = async (id: string) => {
    // First check for linked items
    const checkResult = await checkDomainLinkedItems(id);
    
    if (checkResult.data?.hasItems) {
      const { counts } = checkResult.data;
      const parts = [];
      if (counts.routines > 0) parts.push(`${counts.routines} routine(s)`);
      if (counts.tasks > 0) parts.push(`${counts.tasks} task(s)`);
      if (counts.projects > 0) parts.push(`${counts.projects} project(s)`);
      
      toast.error('Cannot delete domain', {
        description: `This domain has ${parts.join(', ')} linked to it. Please reassign or delete them first.`,
      });
      return;
    }

    const domainToDelete = domains.find(d => d.id === id);
    const result = await deleteDomain(id);
    
    if (result.error) {
      toast.error('Failed to delete domain', {
        description: result.error,
      });
      return;
    }

    setDomains(prev => prev.filter(d => d.id !== id));
    toast.success('Domain deleted', {
      description: domainToDelete ? `"${domainToDelete.name}" has been deleted.` : 'Domain deleted.',
    });

    startTransition(() => {
      router.refresh();
    });
  };

  const handleReorderDomains = async (orderedIds: string[]) => {
    // Optimistic update
    const newOrder = orderedIds.map(id => domains.find(d => d.id === id)!).filter(Boolean);
    setDomains(newOrder);

    const result = await reorderDomains(orderedIds);
    
    if (result.error) {
      // Revert on error
      setDomains(initialDomains);
      toast.error('Failed to reorder domains', {
        description: result.error,
      });
      return;
    }

    if (result.data) {
      setDomains(result.data);
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className={isPending ? 'opacity-70 pointer-events-none' : ''}>
      <DomainsList
        domains={domains}
        onCreateDomain={handleCreateDomain}
        onUpdateDomain={handleUpdateDomain}
        onDeleteDomain={handleDeleteDomain}
        onReorderDomains={handleReorderDomains}
      />
    </div>
  );
}
