/**
 * StoreList - Admin Store Management List View
 * Features: pagination, sorting, filtering, search
 */

import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { GlassCard } from '../../../components/ui/glass-card';
import {
  getStores,
  deleteStore,
  type Store,
  type StoreSearchFilters,
} from '../../../services/admin/storeAdminService';
import { getAdminDegradedModeReason, isStaticPreviewEnv } from '../../../services/admin/runtimeEnv';
import type { TerritoryCode } from '../../../types/extensions';

const TERRITORIES: { code: TerritoryCode; name: string }[] = [
  { code: 'GP', name: 'Guadeloupe' },
  { code: 'MQ', name: 'Martinique' },
  { code: 'GF', name: 'Guyane' },
  { code: 'RE', name: 'Réunion' },
  { code: 'YT', name: 'Mayotte' },
  { code: 'PM', name: 'Saint-Pierre-et-Miquelon' },
  { code: 'BL', name: 'Saint-Barthélemy' },
  { code: 'MF', name: 'Saint-Martin' },
  { code: 'WF', name: 'Wallis-et-Futuna' },
  { code: 'PF', name: 'Polynésie française' },
  { code: 'NC', name: 'Nouvelle-Calédonie' },
];

export default function StoreList() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [territoryFilter, setTerritoryFilter] = useState<TerritoryCode | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const isDegradedMode = isStaticPreviewEnv();
  const degradedReason = getAdminDegradedModeReason();

  const columns = useMemo<ColumnDef<Store>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex items-center gap-1 hover:text-white/90 transition-colors"
          >
            Nom
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium text-white/90">{row.original.name}</div>
        ),
      },
      {
        accessorKey: 'territory',
        header: 'Territoire',
        cell: ({ row }) => {
          const territory = TERRITORIES.find((t) => t.code === row.original.territory);
          return (
            <div className="text-white/80">
              {territory ? territory.name : row.original.territory}
            </div>
          );
        },
      },
      {
        accessorKey: 'city',
        header: 'Ville',
        cell: ({ row }) => <div className="text-white/80">{row.original.city}</div>,
      },
      {
        accessorKey: 'isActive',
        header: 'Statut',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className={row.original.isActive ? 'text-green-400' : 'text-red-400'}>
              {row.original.isActive ? '🟢' : '🔴'}
            </span>
            <span className="text-white/80">
              {row.original.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/admin/stores/${row.original.id}`)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="h-4 w-4 text-blue-400" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, row.original.name)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-4 w-4 text-red-400" />
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data: stores,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  useEffect(() => {
    loadStores();
  }, [currentPage, searchTerm, territoryFilter, statusFilter]);

  const loadStores = async () => {
    if (isDegradedMode) {
      setStores([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const filters: StoreSearchFilters = {
        search: searchTerm || undefined,
        territory: territoryFilter || undefined,
        isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      };

      const response = await getStores(filters, currentPage, 20);
      setStores(response.stores);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Erreur lors du chargement des enseignes');
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'enseigne "${name}" ?`)) {
      return;
    }

    try {
      await deleteStore(id);
      toast.success('Enseigne supprimée avec succès');
      loadStores();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
      console.error('Error deleting store:', error);
    }
  };

  return (
    <div className="space-y-6">
      {isDegradedMode && (
        <div className="p-3 rounded-lg border border-amber-400/40 bg-amber-900/20 text-amber-200 text-sm">
          {degradedReason}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-white">Gestion des enseignes</h1>
        <button
          onClick={() => navigate('/admin/stores/new')}
          disabled={isDegradedMode}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="h-5 w-5" />
          Nouvelle enseigne
        </button>
      </div>

      {/* Filters */}
      <GlassCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Territory Filter */}
          <div>
            <select
              value={territoryFilter}
              onChange={(e) => setTerritoryFilter(e.target.value as TerritoryCode | '')}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Tous les territoires</option>
              {TERRITORIES.map((territory) => (
                <option key={territory.code} value={territory.code}>
                  {territory.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/80"></div>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            Aucune enseigne trouvée
          </div>
        ) : (
          <>
            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {table.getHeaderGroups().map((headerGroup) =>
                      headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-semibold text-white/80"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="text-sm text-white/60">
                  Page {currentPage} sur {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 text-white/80" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5 text-white/80" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlassCard>
    </div>
  );
}
