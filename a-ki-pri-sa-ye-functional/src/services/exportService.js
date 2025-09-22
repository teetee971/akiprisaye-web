// Export utilities for CSV/PDF generation
import { jsPDF } from 'jspdf'

export class ExportService {
  constructor() {
    this.currency = '€'
  }

  // Export data to CSV format
  exportToCSV(data, filename = 'export-akiprisaye.csv') {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter')
    }

    // Determine if it's products or tickets data
    const isTicketData = data[0].hasOwnProperty('products') || data[0].hasOwnProperty('store')
    
    let csvContent
    if (isTicketData) {
      csvContent = this.generateTicketCSV(data)
    } else {
      csvContent = this.generateProductCSV(data)
    }

    this.downloadCSV(csvContent, filename)
  }

  generateProductCSV(products) {
    const headers = [
      'Nom du produit',
      'Prix (€)',
      'Magasin',
      'Territoire',
      'Catégorie',
      'Prix/kg (€)',
      'Date de mise à jour'
    ]

    const rows = products.map(product => [
      this.escapeCsvField(product.name || ''),
      this.formatPrice(product.price || product.best?.price || 0),
      this.escapeCsvField(product.store || product.best?.store || ''),
      this.escapeCsvField(product.territory || ''),
      this.escapeCsvField(product.category || ''),
      this.formatPrice(product.pricePerKg || 0),
      this.formatDate(product.updatedAt || new Date())
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  generateTicketCSV(tickets) {
    const headers = [
      'Date du ticket',
      'Magasin',
      'Produit',
      'Prix (€)',
      'Catégorie',
      'Produit local',
      'Confiance (%)',
      'Total ticket (€)'
    ]

    const rows = []
    tickets.forEach(ticket => {
      const baseInfo = [
        this.formatDate(ticket.date),
        this.escapeCsvField(ticket.store || ''),
        '', // Product name - will be filled per product
        '', // Price - will be filled per product
        '', // Category - will be filled per product
        '', // Local product - will be filled per product
        ticket.confidence || 0,
        this.formatPrice(ticket.total || 0)
      ]

      if (ticket.products && ticket.products.length > 0) {
        ticket.products.forEach(product => {
          const row = [...baseInfo]
          row[2] = this.escapeCsvField(product.name || '')
          row[3] = this.formatPrice(product.price || 0)
          row[4] = this.escapeCsvField(product.category || '')
          row[5] = product.isLocal ? 'Oui' : 'Non'
          rows.push(row)
        })
      } else {
        rows.push(baseInfo)
      }
    })

    return this.arrayToCSV([headers, ...rows])
  }

  arrayToCSV(data) {
    return data.map(row => 
      row.map(field => 
        typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(',')
    ).join('\n')
  }

  escapeCsvField(field) {
    if (typeof field !== 'string') return field
    return field.replace(/"/g, '""')
  }

  formatPrice(price) {
    return typeof price === 'number' ? price.toFixed(2) : '0.00'
  }

  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('fr-FR')
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
  }

  // Export data to PDF format
  async exportToPDF(data, options = {}) {
    const {
      title = 'Export A KI PRI SA YÉ',
      filename = 'export-akiprisaye.pdf',
      includeCharts = false
    } = options

    const doc = new jsPDF()
    let yPosition = 20

    // Title
    doc.setFontSize(16)
    doc.setFont(undefined, 'bold')
    doc.text(title, 20, yPosition)
    yPosition += 15

    // Subtitle with date
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 20, yPosition)
    yPosition += 15

    // Determine data type and generate appropriate content
    const isTicketData = data[0]?.hasOwnProperty('products') || data[0]?.hasOwnProperty('store')
    
    if (isTicketData) {
      yPosition = await this.addTicketsContentToPDF(doc, data, yPosition)
    } else {
      yPosition = await this.addProductsContentToPDF(doc, data, yPosition)
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Page ${i}/${pageCount} - A KI PRI SA YÉ`, 20, 290)
    }

    doc.save(filename)
  }

  async addTicketsContentToPDF(doc, tickets, startY) {
    let yPosition = startY

    tickets.forEach((ticket, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      // Ticket header
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text(`Ticket ${index + 1} - ${ticket.store || 'Magasin inconnu'}`, 20, yPosition)
      yPosition += 8

      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.text(`Date: ${this.formatDate(ticket.date)} | Total: ${this.formatPrice(ticket.total)}${this.currency} | Confiance: ${ticket.confidence}%`, 20, yPosition)
      yPosition += 10

      // Products
      if (ticket.products && ticket.products.length > 0) {
        ticket.products.forEach(product => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          
          const localIcon = product.isLocal ? '🌴 ' : ''
          doc.text(`${localIcon}${product.name} - ${this.formatPrice(product.price)}${this.currency} (${product.category})`, 25, yPosition)
          yPosition += 6
        })
      }
      
      yPosition += 10
    })

    return yPosition
  }

  async addProductsContentToPDF(doc, products, startY) {
    let yPosition = startY

    // Summary
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text(`Résumé: ${products.length} produits`, 20, yPosition)
    yPosition += 10

    // Calculate some statistics
    const avgPrice = products.reduce((sum, p) => sum + (p.price || p.best?.price || 0), 0) / products.length
    const minPrice = Math.min(...products.map(p => p.price || p.best?.price || 0))
    const maxPrice = Math.max(...products.map(p => p.price || p.best?.price || 0))

    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.text(`Prix moyen: ${this.formatPrice(avgPrice)}${this.currency}`, 20, yPosition)
    yPosition += 6
    doc.text(`Prix min: ${this.formatPrice(minPrice)}${this.currency} | Prix max: ${this.formatPrice(maxPrice)}${this.currency}`, 20, yPosition)
    yPosition += 15

    // Products list
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Liste des produits:', 20, yPosition)
    yPosition += 8

    doc.setFont(undefined, 'normal')
    products.forEach((product, index) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      const price = product.price || product.best?.price || 0
      const store = product.store || product.best?.store || ''
      doc.text(`${index + 1}. ${product.name} - ${this.formatPrice(price)}${this.currency} (${store})`, 20, yPosition)
      yPosition += 6
    })

    return yPosition
  }

  // Export comparison data
  exportComparison(products, options = {}) {
    const {
      format = 'csv',
      filename = `comparaison-prix-${new Date().toISOString().split('T')[0]}`
    } = options

    // Sort products by price
    const sortedProducts = [...products].sort((a, b) => {
      const priceA = a.price || a.best?.price || 0
      const priceB = b.price || b.best?.price || 0
      return priceA - priceB
    })

    if (format === 'csv') {
      this.exportToCSV(sortedProducts, `${filename}.csv`)
    } else if (format === 'pdf') {
      this.exportToPDF(sortedProducts, {
        title: 'Comparaison de Prix - A KI PRI SA YÉ',
        filename: `${filename}.pdf`
      })
    }
  }

  // Export historical data
  exportHistory(tickets, dateRange = {}) {
    const { from, to } = dateRange
    let filteredTickets = tickets

    if (from || to) {
      filteredTickets = tickets.filter(ticket => {
        const ticketDate = new Date(ticket.date)
        if (from && ticketDate < new Date(from)) return false
        if (to && ticketDate > new Date(to)) return false
        return true
      })
    }

    const filename = `historique-${from || 'debut'}-${to || 'fin'}.csv`
    this.exportToCSV(filteredTickets, filename)
  }
}

export const exportService = new ExportService()

// Notification service for price alerts
export class NotificationService {
  constructor() {
    this.notifications = this.loadNotifications()
  }

  loadNotifications() {
    try {
      return JSON.parse(localStorage.getItem('akipri.notifications') || '[]')
    } catch {
      return []
    }
  }

  saveNotifications() {
    localStorage.setItem('akipri.notifications', JSON.stringify(this.notifications))
  }

  // Request notification permission
  async requestPermission() {
    if (!('Notification' in window)) {
      throw new Error('Ce navigateur ne supporte pas les notifications')
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return Notification.permission === 'granted'
  }

  // Add price alert
  addPriceAlert(productName, targetPrice, currentPrice) {
    const alert = {
      id: Date.now().toString(),
      productName,
      targetPrice,
      currentPrice,
      createdAt: new Date().toISOString(),
      isActive: true
    }

    this.notifications.push(alert)
    this.saveNotifications()
    return alert
  }

  // Check price alerts
  checkPriceAlerts(products) {
    const alerts = []
    
    this.notifications.forEach(notification => {
      if (!notification.isActive) return

      const product = products.find(p => 
        p.name.toLowerCase().includes(notification.productName.toLowerCase())
      )

      if (product) {
        const currentPrice = product.price || product.best?.price || 0
        if (currentPrice <= notification.targetPrice && currentPrice < notification.currentPrice) {
          alerts.push({
            ...notification,
            newPrice: currentPrice,
            store: product.store || product.best?.store
          })
        }
      }
    })

    return alerts
  }

  // Send notification
  async sendNotification(title, message, options = {}) {
    if (Notification.permission !== 'granted') return false

    try {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.png',
        tag: 'akipri-alert',
        ...options
      })

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000)
      return true
    } catch (error) {
      console.error('Erreur envoi notification:', error)
      return false
    }
  }

  // Remove alert
  removeAlert(alertId) {
    this.notifications = this.notifications.filter(n => n.id !== alertId)
    this.saveNotifications()
  }

  // Get active alerts
  getActiveAlerts() {
    return this.notifications.filter(n => n.isActive)
  }
}

export const notificationService = new NotificationService()