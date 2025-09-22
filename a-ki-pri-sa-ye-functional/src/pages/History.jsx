import { useState, useEffect } from 'react'
import { db } from '../lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { exportService } from '../services/exportService.js'

export default function History() {
  const [tickets, setTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    store: '',
    minAmount: '',
    maxAmount: '',
    category: '',
    searchProduct: '',
    hasLocalProducts: false,
    minConfidence: 0
  })
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [ticketsPerPage] = useState(10)
  const [stores, setStores] = useState([])
  const [categories, setCategories] = useState([])
  const [statistics, setStatistics] = useState(null)

  useEffect(() => {
    loadTickets()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [tickets, filters, sortBy, sortOrder])

  const loadTickets = async () => {
    setLoading(true)
    try {
      // Load parsed tickets
      const ticketsRef = collection(db, 'tickets_parsed')
      const q = query(ticketsRef, orderBy('parsedAt', 'desc'), limit(100))
      const snapshot = await getDocs(q)
      
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setTickets(ticketsData)
      
      // Extract unique stores and categories for filters
      const uniqueStores = [...new Set(ticketsData.map(t => t.store).filter(Boolean))]
      const uniqueCategories = [...new Set(
        ticketsData.flatMap(t => t.products?.map(p => p.category) || []).filter(Boolean)
      )]
      
      setStores(uniqueStores.sort())
      setCategories(uniqueCategories.sort())

      // Calculate statistics
      calculateStatistics(ticketsData)
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (ticketsData) => {
    if (ticketsData.length === 0) return

    const totalAmount = ticketsData.reduce((sum, ticket) => sum + (ticket.total || 0), 0)
    const avgTicket = totalAmount / ticketsData.length
    const totalProducts = ticketsData.reduce((sum, ticket) => sum + (ticket.products?.length || 0), 0)
    const localProducts = ticketsData.reduce((sum, ticket) => 
      sum + (ticket.products?.filter(p => p.isLocal).length || 0), 0
    )

    // Monthly spending
    const monthlySpending = {}
    ticketsData.forEach(ticket => {
      const date = new Date(ticket.date || ticket.parsedAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      monthlySpending[monthKey] = (monthlySpending[monthKey] || 0) + (ticket.total || 0)
    })

    // Store frequency
    const storeFrequency = {}
    ticketsData.forEach(ticket => {
      const store = ticket.store || 'Magasin inconnu'
      storeFrequency[store] = (storeFrequency[store] || 0) + 1
    })

    setStatistics({
      totalTickets: ticketsData.length,
      totalAmount: totalAmount,
      avgTicket: avgTicket,
      totalProducts: totalProducts,
      localProductsRatio: totalProducts > 0 ? (localProducts / totalProducts) * 100 : 0,
      monthlySpending: Object.entries(monthlySpending).map(([month, amount]) => ({ month, amount })),
      topStores: Object.entries(storeFrequency)
        .map(([store, count]) => ({ store, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    })
  }

  const applyFilters = () => {
    let filtered = [...tickets]

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.date || ticket.parsedAt)
        return ticketDate >= new Date(filters.dateFrom)
      })
    }

    if (filters.dateTo) {
      filtered = filtered.filter(ticket => {
        const ticketDate = new Date(ticket.date || ticket.parsedAt)
        return ticketDate <= new Date(filters.dateTo)
      })
    }

    // Store filter
    if (filters.store) {
      filtered = filtered.filter(ticket => ticket.store === filters.store)
    }

    // Amount filters
    if (filters.minAmount) {
      filtered = filtered.filter(ticket => (ticket.total || 0) >= parseFloat(filters.minAmount))
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(ticket => (ticket.total || 0) <= parseFloat(filters.maxAmount))
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(ticket => 
        ticket.products?.some(product => product.category === filters.category)
      )
    }

    // Product search
    if (filters.searchProduct) {
      const searchTerm = filters.searchProduct.toLowerCase()
      filtered = filtered.filter(ticket => 
        ticket.products?.some(product => 
          product.name.toLowerCase().includes(searchTerm)
        )
      )
    }

    // Local products filter
    if (filters.hasLocalProducts) {
      filtered = filtered.filter(ticket => 
        ticket.products?.some(product => product.isLocal)
      )
    }

    // Confidence filter
    if (filters.minConfidence > 0) {
      filtered = filtered.filter(ticket => (ticket.confidence || 0) >= filters.minConfidence)
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date || a.parsedAt)
          bValue = new Date(b.date || b.parsedAt)
          break
        case 'store':
          aValue = a.store || ''
          bValue = b.store || ''
          break
        case 'total':
          aValue = a.total || 0
          bValue = b.total || 0
          break
        case 'confidence':
          aValue = a.confidence || 0
          bValue = b.confidence || 0
          break
        case 'products':
          aValue = a.products?.length || 0
          bValue = b.products?.length || 0
          break
        default:
          aValue = 0
          bValue = 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredTickets(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      store: '',
      minAmount: '',
      maxAmount: '',
      category: '',
      searchProduct: '',
      hasLocalProducts: false,
      minConfidence: 0
    })
  }

  const handleExport = (format) => {
    const dataToExport = filteredTickets
    if (dataToExport.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    const filename = `historique-${filters.dateFrom || 'debut'}-${filters.dateTo || 'fin'}`
    
    if (format === 'csv') {
      exportService.exportToCSV(dataToExport, `${filename}.csv`)
    } else if (format === 'pdf') {
      exportService.exportToPDF(dataToExport, {
        title: 'Historique des achats - A KI PRI SA YÉ',
        filename: `${filename}.pdf`
      })
    }
  }

  // Pagination
  const indexOfLastTicket = currentPage * ticketsPerPage
  const indexOfFirstTicket = indexOfLastTicket - ticketsPerPage
  const currentTickets = filteredTickets.slice(indexOfFirstTicket, indexOfLastTicket)
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage)

  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">🧾 Historique des achats</h2>
        <div className="flex gap-2">
          <button onClick={() => handleExport('csv')} className="link-btn text-sm">
            📊 CSV
          </button>
          <button onClick={() => handleExport('pdf')} className="link-btn text-sm">
            📄 PDF
          </button>
          <button onClick={loadTickets} className="link-btn text-sm">
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{statistics.totalTickets}</div>
            <div className="text-xs text-gray-400">Tickets</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{statistics.totalAmount.toFixed(2)}€</div>
            <div className="text-xs text-gray-400">Total dépensé</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{statistics.avgTicket.toFixed(2)}€</div>
            <div className="text-xs text-gray-400">Ticket moyen</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{statistics.totalProducts}</div>
            <div className="text-xs text-gray-400">Articles</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{statistics.localProductsRatio.toFixed(1)}%</div>
            <div className="text-xs text-gray-400">Produits locaux</div>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="card p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">🔍 Filtres avancés</h3>
          <button onClick={clearFilters} className="text-sm text-blue-400 hover:text-blue-300">
            Effacer tous les filtres
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Date filters */}
          <div>
            <label className="block text-xs font-medium mb-1">Date de début</label>
            <input 
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Date de fin</label>
            <input 
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            />
          </div>

          {/* Store filter */}
          <div>
            <label className="block text-xs font-medium mb-1">Magasin</label>
            <select 
              value={filters.store}
              onChange={(e) => setFilters({...filters, store: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            >
              <option value="">Tous les magasins</option>
              {stores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div>
            <label className="block text-xs font-medium mb-1">Catégorie</label>
            <select 
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Amount filters */}
          <div>
            <label className="block text-xs font-medium mb-1">Montant min (€)</label>
            <input 
              type="number"
              step="0.01"
              value={filters.minAmount}
              onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Montant max (€)</label>
            <input 
              type="number"
              step="0.01"
              value={filters.maxAmount}
              onChange={(e) => setFilters({...filters, maxAmount: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            />
          </div>

          {/* Product search */}
          <div>
            <label className="block text-xs font-medium mb-1">Rechercher un produit</label>
            <input 
              type="text"
              placeholder="Nom du produit..."
              value={filters.searchProduct}
              onChange={(e) => setFilters({...filters, searchProduct: e.target.value})}
              className="card px-2 py-1 text-sm w-full"
            />
          </div>

          {/* Confidence filter */}
          <div>
            <label className="block text-xs font-medium mb-1">Confiance min (%)</label>
            <input 
              type="range"
              min="0"
              max="100"
              value={filters.minConfidence}
              onChange={(e) => setFilters({...filters, minConfidence: parseInt(e.target.value)})}
              className="w-full"
            />
            <div className="text-xs text-center text-gray-400">{filters.minConfidence}%</div>
          </div>
        </div>

        {/* Toggle filters */}
        <div className="mt-4 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox"
              checked={filters.hasLocalProducts}
              onChange={(e) => setFilters({...filters, hasLocalProducts: e.target.checked})}
              className="rounded"
            />
            🌴 Contient des produits locaux
          </label>
        </div>
      </div>

      {/* Sorting and Results Info */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span>Trier par:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="card px-2 py-1 text-sm"
            >
              <option value="date">Date</option>
              <option value="store">Magasin</option>
              <option value="total">Montant</option>
              <option value="confidence">Confiance</option>
              <option value="products">Nb produits</option>
            </select>
          </div>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {sortOrder === 'asc' ? '↗️ Croissant' : '↘️ Décroissant'}
          </button>
        </div>
        <div className="text-sm text-gray-400">
          {filteredTickets.length} ticket{filteredTickets.length > 1 ? 's' : ''} trouvé{filteredTickets.length > 1 ? 's' : ''}
          {filteredTickets.length !== tickets.length && ` sur ${tickets.length}`}
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-2xl mb-4">⏳</div>
          <div className="text-lg">Chargement de l'historique...</div>
        </div>
      ) : currentTickets.length > 0 ? (
        <div className="space-y-4">
          {currentTickets.map(ticket => (
            <div key={ticket.id} className="card p-4 hover:bg-gray-800/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold text-lg">{ticket.store || 'Magasin inconnu'}</div>
                  <div className="text-sm text-gray-400">{formatDate(ticket.date || ticket.parsedAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-400">
                    {ticket.total ? `${ticket.total.toFixed(2)}€` : 'Montant inconnu'}
                  </div>
                  <div className="text-sm text-gray-400">
                    Confiance: 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      (ticket.confidence || 0) >= 80 ? 'bg-green-600' : 
                      (ticket.confidence || 0) >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {ticket.confidence || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {ticket.products && ticket.products.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    📦 {ticket.products.length} produit{ticket.products.length > 1 ? 's' : ''}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {ticket.products.slice(0, 6).map((product, idx) => (
                      <div key={idx} className="bg-gray-800/30 rounded p-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            {product.isLocal && <span className="text-green-400">🌴</span>}
                            {product.name}
                          </span>
                          <span className="font-mono text-blue-400">{product.price?.toFixed(2)}€</span>
                        </div>
                        <div className="text-xs text-gray-400">{product.category}</div>
                      </div>
                    ))}
                    {ticket.products.length > 6 && (
                      <div className="bg-gray-800/30 rounded p-2 text-sm text-center text-gray-400">
                        +{ticket.products.length - 6} autres...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <div className="text-lg mb-2">📭 Aucun ticket trouvé</div>
          <div className="text-sm">
            {Object.values(filters).some(f => f !== '' && f !== false && f !== 0) 
              ? 'Essayez de modifier les filtres'
              : 'Commencez par scanner vos premiers tickets !'
            }
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button 
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="link-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i))
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === pageNum 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button 
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="link-btn text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}