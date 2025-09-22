import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale } from 'chart.js'
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2'
import { statisticsService } from '../services/statisticsService.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
)

export default function Statistics() {
  const [productStats, setProductStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [marketInsights, setMarketInsights] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState('banane')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('product')

  useEffect(() => {
    loadStatistics()
  }, [selectedProduct])

  const loadStatistics = async () => {
    setLoading(true)
    try {
      // Load product statistics
      if (selectedProduct) {
        const prodStats = await statisticsService.getProductPriceStats(selectedProduct)
        setProductStats(prodStats)
      }

      // Load user statistics (mock user ID for demo)
      const userStatsData = await statisticsService.getUserSpendingStats('demo-user')
      setUserStats(userStatsData)

      // Load market insights
      const insights = await statisticsService.getMarketInsights()
      setMarketInsights(insights)
    } catch (error) {
      console.error('Erreur chargement statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const popularProducts = [
    'banane', 'riz', 'ananas', 'pain', 'lait', 'œufs', 'poulet', 'poisson', 'tomate', 'oignon'
  ]

  const tabs = [
    { id: 'product', label: '📊 Produits', icon: '📊' },
    { id: 'personal', label: '👤 Personnel', icon: '👤' },
    { id: 'market', label: '🏪 Marché', icon: '🏪' }
  ]

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">📈 Statistiques & Analyses</h2>
        <button 
          onClick={loadStatistics}
          disabled={loading}
          className="link-btn flex items-center gap-2"
        >
          {loading ? '⏳ Chargement...' : '🔄 Actualiser'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Product Statistics Tab */}
      {activeTab === 'product' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Sélectionner un produit à analyser
              </label>
              <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="card px-3 py-2 w-full"
              >
                {popularProducts.map(product => (
                  <option key={product} value={product}>
                    {product.charAt(0).toUpperCase() + product.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Ou rechercher un produit
              </label>
              <input 
                type="text"
                placeholder="Nom du produit..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setSelectedProduct(e.target.value)
                  }
                }}
                className="card px-3 py-2 w-full"
              />
            </div>
          </div>

          {productStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Price Overview */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">💰 Aperçu des prix - {productStats.productName}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{productStats.minPrice.toFixed(2)}€</div>
                    <div className="text-gray-400">Prix minimum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{productStats.maxPrice.toFixed(2)}€</div>
                    <div className="text-gray-400">Prix maximum</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{productStats.avgPrice.toFixed(2)}€</div>
                    <div className="text-gray-400">Prix moyen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{productStats.priceRange.toFixed(2)}€</div>
                    <div className="text-gray-400">Écart de prix</div>
                  </div>
                </div>
                <div className="mt-4 text-center text-sm text-gray-300">
                  Analysé dans {productStats.totalStores} magasins - {productStats.totalPrices} relevés de prix
                </div>
              </div>

              {/* Store Comparison Chart */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">🏪 Comparaison par magasin</h3>
                {productStats.stores && productStats.stores.length > 0 && (
                  <Bar data={statisticsService.generateChartData(productStats, 'price-comparison').data} 
                       options={statisticsService.generateChartData(productStats, 'price-comparison').options} />
                )}
              </div>

              {/* Territory Distribution */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">🗺️ Distribution par territoire</h3>
                {productStats.territories && productStats.territories.length > 0 && (
                  <Doughnut data={statisticsService.generateChartData(productStats, 'territory-comparison').data} 
                           options={statisticsService.generateChartData(productStats, 'territory-comparison').options} />
                )}
              </div>

              {/* Price Trends */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4">📈 Tendances de prix</h3>
                {productStats.trends && productStats.trends.length > 0 && (
                  <Line data={{
                    labels: productStats.trends.map(t => t.date),
                    datasets: [{
                      label: 'Prix moyen (€)',
                      data: productStats.trends.map(t => t.avgPrice),
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      tension: 0.1
                    }]
                  }} options={{
                    responsive: true,
                    plugins: {
                      title: { display: true, text: 'Évolution des prix sur 6 mois' }
                    }
                  }} />
                )}
              </div>
            </div>
          )}

          {!productStats && !loading && (
            <div className="text-center py-8 text-gray-400">
              <div className="text-lg mb-2">📊 Aucune donnée trouvée</div>
              <div className="text-sm">Essayez avec un autre produit ou vérifiez l'orthographe</div>
            </div>
          )}
        </div>
      )}

      {/* Personal Statistics Tab */}
      {activeTab === 'personal' && userStats && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{userStats.totalTickets}</div>
              <div className="text-sm text-gray-400">Tickets scannés</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{userStats.totalSpent.toFixed(2)}€</div>
              <div className="text-sm text-gray-400">Total dépensé</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{userStats.avgTicketAmount.toFixed(2)}€</div>
              <div className="text-sm text-gray-400">Ticket moyen</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-purple-400">{userStats.topStores.length}</div>
              <div className="text-sm text-gray-400">Magasins fréquentés</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending Trend */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">📈 Évolution des dépenses</h3>
              {userStats.monthlySpending && userStats.monthlySpending.length > 0 && (
                <Line data={statisticsService.generateChartData(userStats, 'spending-trend').data} 
                     options={statisticsService.generateChartData(userStats, 'spending-trend').options} />
              )}
            </div>

            {/* Category Breakdown */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">🛒 Répartition par catégorie</h3>
              {userStats.topCategories && userStats.topCategories.length > 0 && (
                <PolarArea data={statisticsService.generateChartData(userStats, 'category-breakdown').data} 
                          options={statisticsService.generateChartData(userStats, 'category-breakdown').options} />
              )}
            </div>

            {/* Top Stores */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">🏪 Magasins préférés</h3>
              <div className="space-y-3">
                {userStats.topStores.slice(0, 5).map((store, index) => (
                  <div key={store.store} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{store.store}</div>
                        <div className="text-sm text-gray-400">{store.visits} visites</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{store.totalSpent.toFixed(2)}€</div>
                      <div className="text-sm text-gray-400">{store.avgTicket.toFixed(2)}€ /visite</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Savings Opportunities */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">💡 Opportunités d'économies</h3>
              {userStats.savingsOpportunities.length > 0 ? (
                <div className="space-y-3">
                  {userStats.savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className="bg-yellow-900/30 border border-yellow-600 rounded p-3">
                      <div className="font-medium">{opportunity.product}</div>
                      <div className="text-sm text-gray-300 mt-1">{opportunity.recommendation}</div>
                      <div className="text-sm text-green-400 mt-1">
                        Économie potentielle: {opportunity.potentialSavings.toFixed(2)}€
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  Continuez à scanner vos tickets pour découvrir des économies !
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Market Insights Tab */}
      {activeTab === 'market' && marketInsights && (
        <div className="space-y-6">
          {/* Market Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{marketInsights.totalProducts}</div>
              <div className="text-sm text-gray-400">Produits analysés</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{marketInsights.averagePrice?.toFixed(2)}€</div>
              <div className="text-sm text-gray-400">Prix moyen</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-3xl font-bold text-yellow-400">{marketInsights.localProductsRatio?.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Produits locaux</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Territory Comparison */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">🗺️ Comparaison par territoire</h3>
              <div className="space-y-3">
                {Object.entries(marketInsights.priceByTerritory || {}).map(([territory, data]) => (
                  <div key={territory} className="flex justify-between items-center">
                    <div className="font-medium">{territory}</div>
                    <div className="text-right">
                      <div className="font-semibold">{data.avgPrice?.toFixed(2)}€</div>
                      <div className="text-sm text-gray-400">{data.productCount} produits</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Store Performance */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">🏪 Performance des enseignes</h3>
              <div className="space-y-3">
                {marketInsights.storeComparison?.slice(0, 6).map((store, index) => (
                  <div key={store.store} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-green-600' : index === 1 ? 'bg-yellow-600' : 'bg-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="font-medium">{store.store}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{store.avgPrice.toFixed(2)}€</div>
                      <div className="text-sm text-gray-400">{store.productCount} produits</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Expensive Categories */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">💰 Catégories les plus chères</h3>
              <div className="space-y-3">
                {marketInsights.topExpensiveCategories?.map((category, index) => (
                  <div key={category.category} className="flex justify-between items-center">
                    <div className="font-medium">{category.category}</div>
                    <div className="text-right">
                      <div className="font-semibold">{category.avgPrice.toFixed(2)}€</div>
                      <div className="text-sm text-gray-400">{category.productCount} produits</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Trends */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4">📊 Tendances saisonnières</h3>
              <div className="space-y-3">
                {marketInsights.seasonalTrends?.map((trend, index) => (
                  <div key={trend.season} className="bg-gray-800/50 rounded p-3">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">{trend.season}</div>
                      <div className={`font-semibold ${trend.avgPriceChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {trend.avgPriceChange > 0 ? '+' : ''}{trend.avgPriceChange}%
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">{trend.comment}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inflation Indicator */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4">📈 Indicateur d'inflation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">+{marketInsights.inflationIndicator?.currentMonthChange}%</div>
                <div className="text-sm text-gray-400">Ce mois</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">+{marketInsights.inflationIndicator?.yearToDateChange}%</div>
                <div className="text-sm text-gray-400">Depuis janvier</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-300 mt-2">{marketInsights.inflationIndicator?.comparison}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="text-2xl mb-4">⏳</div>
          <div className="text-lg">Chargement des statistiques...</div>
        </div>
      )}
    </div>
  )
}