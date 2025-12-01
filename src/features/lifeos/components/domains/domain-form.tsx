// @ts-nocheck
/**
 * Domain Form Component
 * 
 * Form for creating and editing domains.
 * Uses Dialog for modal presentation.
 * 
 * @module lifeos/components/domains/domain-form
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  createDomainSchema, 
  type CreateDomainInput,
  type Domain,
} from '../../schema/domains.schema';

// Predefined colors for domain selection
const DOMAIN_COLORS = [
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Gray', value: '#6B7280' },
];

// Common emojis for domains
const DOMAIN_ICONS = [
  '📌', '🙏', '💪', '💼', '📚', '👥', '🎮', '💰', '🏠',
  '🎯', '✨', '🌟', '💡', '🔥', '🌱', '🎨', '🎵', '📱',
  '✈️', '🏃', '🧘', '📝', '🔧', '🎓', '❤️', '🌍', '⚡',
];

interface DomainFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: Domain | null;
  onSubmit: (data: CreateDomainInput) => Promise<void>;
}

export function DomainForm({ 
  open, 
  onOpenChange, 
  domain,
  onSubmit,
}: DomainFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!domain;

  const form = useForm<CreateDomainInput>({
    resolver: zodResolver(createDomainSchema),
    defaultValues: {
      name: '',
      icon: '📌',
      color: '#6B7280',
      vision: null,
      daily_target_minutes: null,
      weekly_target_minutes: null,
    },
  });

  // Reset form when domain changes
  useEffect(() => {
    if (domain) {
      form.reset({
        name: domain.name,
        icon: domain.icon,
        color: domain.color,
        vision: domain.vision,
        daily_target_minutes: domain.daily_target_minutes,
        weekly_target_minutes: domain.weekly_target_minutes,
      });
    } else {
      form.reset({
        name: '',
        icon: '📌',
        color: '#6B7280',
        vision: null,
        daily_target_minutes: null,
        weekly_target_minutes: null,
      });
    }
  }, [domain, form]);

  const handleSubmit = async (data: CreateDomainInput) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Domain' : 'Create Domain'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the details of your life domain.'
              : 'Add a new domain to organize your life activities.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Health & Fitness" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Icon */}
            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {DOMAIN_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => field.onChange(icon)}
                          className={`
                            w-10 h-10 text-xl rounded-md flex items-center justify-center
                            transition-all hover:scale-110
                            ${field.value === icon 
                              ? 'bg-primary/20 ring-2 ring-primary' 
                              : 'bg-muted hover:bg-muted/80'}
                          `}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {DOMAIN_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={`
                            w-8 h-8 rounded-full transition-all hover:scale-110
                            ${field.value === color.value 
                              ? 'ring-2 ring-offset-2 ring-primary' 
                              : ''}
                          `}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Vision */}
            <FormField
              control={form.control}
              name="vision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vision (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What does success look like in this domain?"
                      className="resize-none"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your long-term vision for this area of your life.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time targets */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="daily_target_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Target (hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.5"
                        placeholder="e.g., 2"
                        {...field}
                        value={field.value ? field.value / 60 : ''}
                        onChange={(e) => {
                          const hours = parseFloat(e.target.value);
                          field.onChange(hours ? Math.round(hours * 60) : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weekly_target_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Target (hours)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.5"
                        placeholder="e.g., 10"
                        {...field}
                        value={field.value ? field.value / 60 : ''}
                        onChange={(e) => {
                          const hours = parseFloat(e.target.value);
                          field.onChange(hours ? Math.round(hours * 60) : null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Create Domain'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
