// Enhanced statistics service for A KI PRI SA YÉ
import { db } from '../lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

export class StatisticsService {
  constructor() {
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  // Get cached data or fetch from Firestore
  async getCachedData(key, fetcher) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    return data
  }

  // Get price statistics for a product across different stores
  async getProductPriceStats(productName) {
    const key = `product-stats-${productName.toLowerCase()}`
    
    return this.getCachedData(key, async () => {
      const productsRef = collection(db, 'products')
      const q = query(productsRef, where('name', '>=', productName.toLowerCase()))
      const snapshot = await getDocs(q)
      
      const products = snapshot.docs
        .map(doc => doc.data())
        .filter(p => p.name.toLowerCase().includes(productName.toLowerCase()))

      if (products.length === 0) return null

      const allPrices = products.flatMap(p => 
        p.prices?.map(price => ({
          ...price,
          productName: p.name,
          category: p.category,
          territory: p.territory
        })) || []
      )

      if (allPrices.length === 0) return null

      const prices = allPrices.map(p => p.price).sort((a, b) => a - b)
      
      return {
        productName,
        totalStores: new Set(allPrices.map(p => p.store)).size,
        totalPrices: prices.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        medianPrice: prices[Math.floor(prices.length / 2)],
        priceRange: Math.max(...prices) - Math.min(...prices),
        stores: this.groupPricesByStore(allPrices),
        territories: this.groupPricesByTerritory(allPrices),
        trends: await this.getPriceTrends(productName)
      }
    })
  }

  groupPricesByStore(prices) {
    const grouped = {}
    prices.forEach(price => {
      if (!grouped[price.store]) {
        grouped[price.store] = []
      }
      grouped[price.store].push(price.price)
    })

    return Object.entries(grouped).map(([store, storePrices]) => ({
      store,
      avgPrice: storePrices.reduce((sum, p) => sum + p, 0) / storePrices.length,
      minPrice: Math.min(...storePrices),
      maxPrice: Math.max(...storePrices),
      count: storePrices.length
    })).sort((a, b) => a.avgPrice - b.avgPrice)
  }

  groupPricesByTerritory(prices) {
    const grouped = {}
    prices.forEach(price => {
      const territory = price.territory || 'Non spécifié'
      if (!grouped[territory]) {
        grouped[territory] = []
      }
      grouped[territory].push(price.price)
    })

    return Object.entries(grouped).map(([territory, territoryPrices]) => ({
      territory,
      avgPrice: territoryPrices.reduce((sum, p) => sum + p, 0) / territoryPrices.length,
      minPrice: Math.min(...territoryPrices),
      maxPrice: Math.max(...territoryPrices),
      count: territoryPrices.length
    })).sort((a, b) => a.avgPrice - b.avgPrice)
  }

  // Get price trends over time (mock for now, would need historical data)
  async getPriceTrends(productName) {
    // This would fetch historical price data
    // For now, return mock trend data
    const basePrice = 2.5
    const months = 6
    const trends = []

    for (let i = months; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      
      // Simulate price fluctuation
      const variation = (Math.random() - 0.5) * 0.4
      const price = basePrice + variation
      
      trends.push({
        date: date.toISOString().split('T')[0],
        avgPrice: Math.max(0.1, price),
        count: Math.floor(Math.random() * 10) + 5
      })
    }

    return trends
  }

  // Get user spending statistics from tickets
  async getUserSpendingStats(userId) {
    const key = `user-spending-${userId}`
    
    return this.getCachedData(key, async () => {
      const ticketsRef = collection(db, 'tickets_parsed')
      const q = query(ticketsRef, where('userId', '==', userId), orderBy('parsedAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const tickets = snapshot.docs.map(doc => doc.data())
      
      if (tickets.length === 0) {
        return {
          totalTickets: 0,
          totalSpent: 0,
          avgTicketAmount: 0,
          monthlySpending: [],
          topStores: [],
          topCategories: [],
          savingsOpportunities: []
        }
      }

      const totalSpent = tickets.reduce((sum, ticket) => sum + (ticket.total || 0), 0)
      const avgTicketAmount = totalSpent / tickets.length

      return {
        totalTickets: tickets.length,
        totalSpent,
        avgTicketAmount,
        monthlySpending: this.calculateMonthlySpending(tickets),
        topStores: this.getTopStores(tickets),
        topCategories: this.getTopCategories(tickets),
        savingsOpportunities: await this.calculateSavingsOpportunities(tickets)
      }
    })
  }

  calculateMonthlySpending(tickets) {
    const monthlySpending = {}
    
    tickets.forEach(ticket => {
      const date = new Date(ticket.parsedAt || ticket.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlySpending[monthKey]) {
        monthlySpending[monthKey] = 0
      }
      monthlySpending[monthKey] += ticket.total || 0
    })

    return Object.entries(monthlySpending)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  getTopStores(tickets) {
    const storeSpending = {}
    
    tickets.forEach(ticket => {
      const store = ticket.store || 'Magasin inconnu'
      if (!storeSpending[store]) {
        storeSpending[store] = { spending: 0, visits: 0 }
      }
      storeSpending[store].spending += ticket.total || 0
      storeSpending[store].visits += 1
    })

    return Object.entries(storeSpending)
      .map(([store, data]) => ({
        store,
        totalSpent: data.spending,
        visits: data.visits,
        avgTicket: data.spending / data.visits
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
  }

  getTopCategories(tickets) {
    const categorySpending = {}
    
    tickets.forEach(ticket => {
      if (ticket.products) {
        ticket.products.forEach(product => {
          const category = product.category || 'Non catégorisé'
          if (!categorySpending[category]) {
            categorySpending[category] = { spending: 0, count: 0 }
          }
          categorySpending[category].spending += product.price || 0
          categorySpending[category].count += 1
        })
      }
    })

    return Object.entries(categorySpending)
      .map(([category, data]) => ({
        category,
        totalSpent: data.spending,
        itemCount: data.count,
        avgPrice: data.spending / data.count
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
  }

  async calculateSavingsOpportunities(tickets) {
    // Analyze tickets to find potential savings
    const opportunities = []
    const productFrequency = {}

    // Count frequently bought products
    tickets.forEach(ticket => {
      if (ticket.products) {
        ticket.products.forEach(product => {
          const name = product.name.toLowerCase()
          if (!productFrequency[name]) {
            productFrequency[name] = { count: 0, totalSpent: 0, prices: [] }
          }
          productFrequency[name].count += 1
          productFrequency[name].totalSpent += product.price || 0
          productFrequency[name].prices.push(product.price || 0)
        })
      }
    })

    // Find products bought frequently with price variations
    Object.entries(productFrequency).forEach(([productName, data]) => {
      if (data.count >= 3 && data.prices.length > 1) {
        const maxPrice = Math.max(...data.prices)
        const minPrice = Math.min(...data.prices)
        const avgPrice = data.totalSpent / data.count
        const potentialSavings = (avgPrice - minPrice) * data.count

        if (potentialSavings > 1) { // Only show if savings > 1€
          opportunities.push({
            product: productName,
            frequency: data.count,
            avgPrice,
            minPrice,
            maxPrice,
            potentialSavings,
            recommendation: `Privilégier les achats à ${minPrice.toFixed(2)}€ plutôt qu'à ${maxPrice.toFixed(2)}€`
          })
        }
      }
    })

    return opportunities.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 5)
  }

  // Get market insights for DOM-TOM
  async getMarketInsights() {
    const key = 'market-insights'
    
    return this.getCachedData(key, async () => {
      const productsRef = collection(db, 'products')
      const snapshot = await getDocs(productsRef)
      const products = snapshot.docs.map(doc => doc.data())

      if (products.length === 0) return null

      const insights = {
        totalProducts: products.length,
        averagePrice: 0,
        priceByTerritory: {},
        topExpensiveCategories: [],
        localProductsRatio: 0,
        storeComparison: this.generateStoreComparison(products),
        seasonalTrends: this.generateSeasonalTrends(),
        inflationIndicator: this.calculateInflationIndicator()
      }

      // Calculate average price
      const allPrices = products.flatMap(p => p.prices?.map(price => price.price) || [])
      insights.averagePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length

      // Group by territory
      products.forEach(product => {
        const territory = product.territory || 'Non spécifié'
        if (!insights.priceByTerritory[territory]) {
          insights.priceByTerritory[territory] = { totalPrice: 0, count: 0 }
        }
        const avgProductPrice = product.prices?.reduce((sum, p) => sum + p.price, 0) / (product.prices?.length || 1)
        insights.priceByTerritory[territory].totalPrice += avgProductPrice || 0
        insights.priceByTerritory[territory].count += 1
      })

      // Convert to averages
      Object.keys(insights.priceByTerritory).forEach(territory => {
        const data = insights.priceByTerritory[territory]
        insights.priceByTerritory[territory] = {
          avgPrice: data.totalPrice / data.count,
          productCount: data.count
        }
      })

      // Top expensive categories
      const categoryPrices = {}
      products.forEach(product => {
        const category = product.category || 'Non catégorisé'
        if (!categoryPrices[category]) {
          categoryPrices[category] = []
        }
        if (product.prices) {
          const avgPrice = product.prices.reduce((sum, p) => sum + p.price, 0) / product.prices.length
          categoryPrices[category].push(avgPrice)
        }
      })

      insights.topExpensiveCategories = Object.entries(categoryPrices)
        .map(([category, prices]) => ({
          category,
          avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
          productCount: prices.length
        }))
        .sort((a, b) => b.avgPrice - a.avgPrice)
        .slice(0, 5)

      // Local products ratio
      const localProducts = products.filter(p => this.isLocalProduct(p.name))
      insights.localProductsRatio = (localProducts.length / products.length) * 100

      return insights
    })
  }

  isLocalProduct(productName) {
    const localKeywords = [
      'antilles', 'martinique', 'guadeloupe', 'guyane', 'réunion', 'mayotte',
      'banane', 'ananas', 'coco', 'mangue', 'papaye', 'goyave',
      'christophine', 'igname', 'manioc', 'patate', 'ti-punch', 'rhum'
    ]
    return localKeywords.some(keyword => productName.toLowerCase().includes(keyword))
  }

  generateStoreComparison(products) {
    const storeStats = {}
    
    products.forEach(product => {
      if (product.prices) {
        product.prices.forEach(price => {
          if (!storeStats[price.store]) {
            storeStats[price.store] = { prices: [], productCount: 0 }
          }
          storeStats[price.store].prices.push(price.price)
          storeStats[price.store].productCount += 1
        })
      }
    })

    return Object.entries(storeStats)
      .map(([store, data]) => ({
        store,
        avgPrice: data.prices.reduce((sum, price) => sum + price, 0) / data.prices.length,
        productCount: data.productCount,
        priceRange: Math.max(...data.prices) - Math.min(...data.prices)
      }))
      .sort((a, b) => a.avgPrice - b.avgPrice)
  }

  generateSeasonalTrends() {
    // Mock seasonal trends data
    return [
      { season: 'Hiver', avgPriceChange: -2.3, comment: 'Baisse saisonnière des fruits locaux' },
      { season: 'Printemps', avgPriceChange: 1.8, comment: 'Hausse légère des légumes importés' },
      { season: 'Été', avgPriceChange: -1.2, comment: 'Période de récolte, prix plus bas' },
      { season: 'Automne', avgPriceChange: 3.2, comment: 'Fin de saison, prix en hausse' }
    ]
  }

  calculateInflationIndicator() {
    // Mock inflation data
    return {
      currentMonthChange: 2.1,
      yearToDateChange: 4.8,
      comparison: 'Légèrement au-dessus de la moyenne nationale'
    }
  }

  // Generate chart data for different visualizations
  generateChartData(stats, chartType) {
    switch (chartType) {
      case 'price-comparison':
        return {
          type: 'bar',
          data: {
            labels: stats.stores?.map(s => s.store) || [],
            datasets: [{
              label: 'Prix moyen (€)',
              data: stats.stores?.map(s => s.avgPrice) || [],
              backgroundColor: 'rgba(54, 162, 235, 0.8)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: `Comparaison des prix - ${stats.productName}` }
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Prix (€)' } }
            }
          }
        }

      case 'territory-comparison':
        return {
          type: 'doughnut',
          data: {
            labels: stats.territories?.map(t => t.territory) || [],
            datasets: [{
              data: stats.territories?.map(t => t.avgPrice) || [],
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: 'Prix par territoire' },
              legend: { position: 'bottom' }
            }
          }
        }

      case 'spending-trend':
        return {
          type: 'line',
          data: {
            labels: stats.monthlySpending?.map(m => m.month) || [],
            datasets: [{
              label: 'Dépenses mensuelles (€)',
              data: stats.monthlySpending?.map(m => m.amount) || [],
              fill: false,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: 'Évolution des dépenses' }
            },
            scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Montant (€)' } }
            }
          }
        }

      case 'category-breakdown':
        return {
          type: 'polarArea',
          data: {
            labels: stats.topCategories?.map(c => c.category) || [],
            datasets: [{
              data: stats.topCategories?.map(c => c.totalSpent) || [],
              backgroundColor: [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: { display: true, text: 'Répartition par catégorie' },
              legend: { position: 'right' }
            }
          }
        }

      default:
        return null
    }
  }
}

export const statisticsService = new StatisticsService()