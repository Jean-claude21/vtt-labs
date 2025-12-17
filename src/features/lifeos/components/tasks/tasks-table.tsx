/**
 * Tasks Table Component
 * 
 * Reusable table view for tasks with sorting, filtering, and actions.
 * Can be used in both Projects and Tasks sections.
 * 
 * @module lifeos/components/tasks
 */
'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Filter,
  Columns3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Task } from '../../schema/tasks.schema';

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  backlog: { label: 'Backlog', icon: Circle, color: 'bg-gray-500' },
  todo: { label: 'À faire', icon: Circle, color: 'bg-blue-500' },
  in_progress: { label: 'En cours', icon: Clock, color: 'bg-yellow-500' },
  blocked: { label: 'Bloqué', icon: AlertCircle, color: 'bg-red-500' },
  done: { label: 'Terminé', icon: CheckCircle2, color: 'bg-green-500' },
  cancelled: { label: 'Annulé', icon: Circle, color: 'bg-gray-400' },
  archived: { label: 'Archivé', icon: Circle, color: 'bg-gray-400' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  high: { label: 'Haute', color: 'text-red-600 border-red-600' },
  medium: { label: 'Moyenne', color: 'text-yellow-600 border-yellow-600' },
  low: { label: 'Basse', color: 'text-gray-500 border-gray-500' },
};

interface TasksTableProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskDelete?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: Task['status']) => void;
  onSelectionChange?: (selectedTasks: Task[]) => void;
  showProjectColumn?: boolean;
  showParentColumn?: boolean;
}

export function TasksTable({
  tasks,
  onTaskClick,
  onTaskDelete,
  onStatusChange,
  onSelectionChange,
  showProjectColumn = false,
  showParentColumn = true,
}: Readonly<TasksTableProps>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');

  // Build parent task map for display
  const parentTaskMap = React.useMemo(() => {
    const map = new Map<string, Task>();
    for (const task of tasks) {
      map.set(task.id, task);
    }
    return map;
  }, [tasks]);

  // Filter tasks based on status and priority
  const filteredTasks = React.useMemo(() => {
    return tasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  // Define columns
  const columns: ColumnDef<Task>[] = React.useMemo(() => {
    const cols: ColumnDef<Task>[] = [
      // Selection column
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Sélectionner tout"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Sélectionner la ligne"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      // Title column
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Titre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const task = row.original;
          const isSubtask = !!task.parent_task_id;
          return (
            <div className="flex items-center gap-2">
              {isSubtask && <span className="text-muted-foreground">↳</span>}
              <button
                type="button"
                onClick={() => onTaskClick?.(task)}
                className="font-medium hover:text-primary hover:underline text-left truncate max-w-[300px]"
              >
                {task.title}
              </button>
            </div>
          );
        },
      },
      // Status column
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const status = row.getValue('status') as string;
          const config = STATUS_CONFIG[status];
          const Icon = config?.icon || Circle;
          return (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config?.color}`} />
              <span className="text-sm">{config?.label || status}</span>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          return value === 'all' || row.getValue(id) === value;
        },
      },
      // Priority column
      {
        accessorKey: 'priority',
        header: 'Priorité',
        cell: ({ row }) => {
          const priority = row.getValue('priority') as string;
          const config = PRIORITY_CONFIG[priority];
          return (
            <Badge variant="outline" className={config?.color}>
              {config?.label || priority}
            </Badge>
          );
        },
      },
      // Due date column
      {
        accessorKey: 'due_date',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="-ml-4"
          >
            Échéance
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.getValue('due_date') as string | null;
          if (!date) return <span className="text-muted-foreground">-</span>;
          
          const dueDate = new Date(date);
          const today = new Date();
          const isOverdue = dueDate < today && row.original.status !== 'done';
          
          return (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              {dueDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          );
        },
      },
      // Estimated time column
      {
        accessorKey: 'estimated_minutes',
        header: 'Temps estimé',
        cell: ({ row }) => {
          const minutes = row.getValue('estimated_minutes') as number | null;
          if (!minutes) return <span className="text-muted-foreground">-</span>;
          
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          return (
            <span className="text-sm">
              {hours > 0 && `${hours}h`}{mins > 0 && `${mins}m`}
            </span>
          );
        },
      },
    ];

    // Add parent column if enabled
    if (showParentColumn) {
      cols.push({
        id: 'parent',
        header: 'Tâche parente',
        cell: ({ row }) => {
          const parentId = row.original.parent_task_id;
          if (!parentId) return <span className="text-muted-foreground">-</span>;
          
          const parent = parentTaskMap.get(parentId);
          return (
            <button
              type="button"
              onClick={() => parent && onTaskClick?.(parent)}
              className="text-sm text-muted-foreground hover:text-primary truncate max-w-[150px]"
            >
              {parent?.title || parentId.slice(0, 8)}
            </button>
          );
        },
      });
    }

    // Add project column if enabled
    if (showProjectColumn) {
      cols.push({
        accessorKey: 'project_id',
        header: 'Projet',
        cell: ({ row }) => {
          const projectId = row.getValue('project_id') as string | null;
          if (!projectId) return <span className="text-muted-foreground">-</span>;
          return <span className="text-sm truncate">{projectId.slice(0, 8)}...</span>;
        },
      });
    }

    // Actions column
    cols.push({
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const task = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Ouvrir le menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onTaskClick?.(task)}>
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Changer le statut
              </DropdownMenuLabel>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => onStatusChange?.(task.id, key as Task['status'])}
                  disabled={task.status === key}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 ${config.color}`} />
                  {config.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onTaskDelete?.(task)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    });

    return cols;
  }, [showProjectColumn, showParentColumn, parentTaskMap, onTaskClick, onTaskDelete, onStatusChange]);

  const table = useReactTable({
    data: filteredTasks,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Notify parent of selection changes
  React.useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedTasks = selectedRows.map(row => row.original);
    onSelectionChange?.(selectedTasks);
  }, [rowSelection, table, onSelectionChange]);

  return (
    <div className="space-y-4">
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Rechercher une tâche..."
            value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('title')?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${config.color}`} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority filter */}
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes priorités</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Column visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Columns3 className="mr-2 h-4 w-4" />
              Colonnes
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Selection info */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} tâche(s) sélectionnée(s)
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucune tâche trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredTasks.length} tâche(s) au total
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} sur{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Suivant
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
