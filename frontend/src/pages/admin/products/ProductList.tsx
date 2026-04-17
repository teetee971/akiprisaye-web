import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import { Package, Edit, Trash2, Plus, Search, Image as ImageIcon } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import {
  getProducts,
  deleteProduct,
  getProductsStatic,
  type Product,
} from '@/services/admin/productAdminService';
import type { ProductCategory } from '@/types/product';
import toast from 'react-hot-toast';
import { getAdminDegradedModeReason, isStaticPreviewEnv } from '@/services/admin/runtimeEnv';

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'alimentaire',
  'boissons',
  'hygiene',
  'entretien',
  'bebe',
  'viande',
  'poisson',
  'fruits-legumes',
  'pain-patisserie',
  'produits-laitiers',
  'epicerie',
  'surgeles',
  'autre',
];

export function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const isDegradedMode = isStaticPreviewEnv();
  const degradedReason = getAdminDegradedModeReason();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | ''>('');
  const [brandFilter, setBrandFilter] = useState('');
  const [hasEanFilter, setHasEanFilter] = useState<boolean | undefined>(undefined);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isDegradedMode) {
        const all = await getProductsStatic();
        let filtered = all;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.ean?.includes(q) ||
              p.brand?.toLowerCase().includes(q)
          );
        }
        if (categoryFilter) {
          filtered = filtered.filter((p) => p.category === categoryFilter);
        }
        if (brandFilter) {
          const b = brandFilter.toLowerCase();
          filtered = filtered.filter((p) => p.brand?.toLowerCase().includes(b));
        }
        if (hasEanFilter === true) {
          filtered = filtered.filter((p) => Boolean(p.ean));
        }
        const start = (currentPage - 1) * 20;
        setProducts(filtered.slice(start, start + 20));
        setTotal(filtered.length);
        setTotalPages(Math.max(1, Math.ceil(filtered.length / 20)));
        return;
      }

      const filters = {
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        brand: brandFilter || undefined,
        hasEan: hasEanFilter,
      };
      const data = await getProducts(filters, currentPage, 20);
      setProducts(data.products);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch products');
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, categoryFilter, brandFilter, hasEanFilter, isDegradedMode]);

  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
        return;
      }

      try {
        await deleteProduct(id);
        toast.success('Produit supprimé avec succès');
        // Force refresh by calling fetchProducts directly
        await fetchProducts();
      } catch {
        toast.error('Erreur lors de la suppression du produit');
      }
    },
    [fetchProducts]
  );

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'imageUrl',
        header: 'Image',
        cell: ({ row }) => (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
            {row.original.imageUrl ? (
              <img
                src={row.original.imageUrl}
                alt={row.original.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-white/30" />
            )}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: 'Nom',
        cell: ({ row }) => <div className="font-medium text-white/90">{row.original.name}</div>,
      },
      {
        accessorKey: 'brand',
        header: 'Marque',
        cell: ({ row }) => <div className="text-white/70">{row.original.brand || '-'}</div>,
      },
      {
        accessorKey: 'category',
        header: 'Catégorie',
        cell: ({ row }) => (
          <span className="px-2 py-1 rounded-md bg-white/10 text-white/80 text-sm">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'ean',
        header: 'EAN',
        cell: ({ row }) => (
          <div className="text-white/70 font-mono text-sm">{row.original.ean || '-'}</div>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/admin/products/${row.original.id}`)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Voir les détails"
            >
              <Package className="w-4 h-4 text-white/70" />
            </button>
            <button
              onClick={() => navigate(`/admin/products/${row.original.id}/edit`)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Modifier"
            >
              <Edit className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => handleDelete(row.original.id, row.original.name)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [navigate, handleDelete]
  );

  const table = useReactTable({
    data: products,
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
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-white/90 flex items-center gap-3">
          <Package className="w-8 h-8" />
          Gestion des Produits
        </h1>
        <button
          onClick={() => navigate('/admin/products/new')}
          disabled={isDegradedMode}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Nouveau produit
        </button>
      </div>
      {isDegradedMode && (
        <div className="mb-4 p-3 rounded-lg border border-amber-400/40 bg-amber-900/20 text-amber-200 text-sm">
          {degradedReason}
        </div>
      )}

      <GlassCard className="mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Rechercher par nom ou EAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="pl-categorie"
                className="block text-sm font-medium text-white/70 mb-2"
              >
                Catégorie
              </label>
              <select
                id="pl-categorie"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as ProductCategory | '');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les catégories</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pl-marque" className="block text-sm font-medium text-white/70 mb-2">
                Marque
              </label>
              <input
                id="pl-marque"
                type="text"
                placeholder="Filtrer par marque..."
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white/90 placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasEanFilter === true}
                  onChange={(e) => {
                    setHasEanFilter(e.target.checked ? true : undefined);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-white/80">Avec EAN uniquement</span>
              </label>
            </div>
          </div>
        </form>
      </GlassCard>

      <GlassCard>
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="mt-4 text-white/60">Chargement des produits...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Réessayer
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">Aucun produit trouvé</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-b border-white/10">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-sm font-semibold text-white/70"
                        >
                          {header.isPlaceholder ? null : header.column.getCanSort() ? (
                            <button
                              type="button"
                              className="cursor-pointer select-none flex items-center gap-2 bg-transparent border-0 p-0 font-semibold text-white/70"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </button>
                          ) : (
                            flexRender(header.column.columnDef.header, header.getContext())
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-white/60">
                Page {currentPage} sur {totalPages} ({total} produits)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white/90 rounded-lg transition-colors"
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-white/90 rounded-lg transition-colors"
                >
                  Suivant
                </button>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </div>
  );
}
