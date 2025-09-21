/**
 * Export utilities for A KI PRI SA YÉ
 * Provides Excel and PDF export functionality for price comparisons
 */

class ExportUtils {
  constructor() {
    this.loadLibraries();
  }

  // Load required libraries dynamically
  async loadLibraries() {
    if (typeof window !== 'undefined') {
      // Load SheetJS for Excel export
      if (!window.XLSX) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }

      // Load jsPDF for PDF export
      if (!window.jsPDF) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
      }
    }
  }

  /**
   * Export comparison data to Excel
   * @param {Array} data - Array of comparison objects
   * @param {string} filename - Output filename
   */
  exportToExcel(data, filename = 'comparaison_prix') {
    if (!window.XLSX) {
      console.error('XLSX library not loaded');
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = data.map(item => ({
        'Produit': item.name || item.produit || '',
        'Enseigne': item.store || item.enseigne || '',
        'Prix': item.price || item.prix || 0,
        'Zone': item.zone || item.territoire || '',
        'Date': item.date || new Date().toLocaleDateString('fr-FR'),
        'Prix au kg/L': item.unitPrice || item.prixUnitaire || '',
        'Promotion': item.promo ? 'Oui' : 'Non',
        'Stock': item.stock || 'Disponible'
      }));

      // Create workbook
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.json_to_sheet(excelData);

      // Style the header
      const range = window.XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = window.XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "0F172A" } },
          color: { rgb: "00E5FF" }
        };
      }

      // Add metadata sheet
      const metadata = [
        ['Rapport généré le:', new Date().toLocaleDateString('fr-FR')],
        ['Source:', 'A KI PRI SA YÉ - Comparateur DROM-COM'],
        ['Nombre de produits:', data.length],
        ['URL:', 'https://akiprisaye.pages.dev']
      ];
      const wsMetadata = window.XLSX.utils.aoa_to_sheet(metadata);

      window.XLSX.utils.book_append_sheet(wb, ws, "Comparaison Prix");
      window.XLSX.utils.book_append_sheet(wb, wsMetadata, "Informations");

      // Download file
      window.XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log('Export Excel réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  }

  /**
   * Export comparison data to PDF
   * @param {Array} data - Array of comparison objects
   * @param {string} filename - Output filename
   */
  exportToPDF(data, filename = 'comparaison_prix') {
    if (!window.jsPDF) {
      console.error('jsPDF library not loaded');
      return;
    }

    try {
      const { jsPDF } = window.jsPDF;
      const pdf = new jsPDF();

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(15, 23, 42); // Dark blue
      pdf.text('A KI PRI SA YÉ', 20, 20);
      
      pdf.setFontSize(14);
      pdf.text('Comparaison de prix - DROM-COM', 20, 30);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, 40);
      
      // Table headers
      const headers = ['Produit', 'Enseigne', 'Prix', 'Zone'];
      let y = 60;
      
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      
      // Draw headers
      headers.forEach((header, index) => {
        pdf.text(header, 20 + (index * 45), y);
      });
      
      y += 10;
      
      // Draw data
      pdf.setFontSize(10);
      data.slice(0, 30).forEach(item => { // Limit to 30 items for PDF
        const row = [
          (item.name || item.produit || '').substring(0, 20),
          (item.store || item.enseigne || '').substring(0, 15),
          `${item.price || item.prix || 0}€`,
          (item.zone || item.territoire || '').substring(0, 10)
        ];
        
        row.forEach((cell, index) => {
          pdf.text(cell, 20 + (index * 45), y);
        });
        
        y += 8;
        
        // New page if needed
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
      });
      
      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text('https://akiprisaye.pages.dev', 20, 285);
      
      // Download PDF
      pdf.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('Export PDF réussi');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    }
  }

  /**
   * Export current comparison data from the page
   */
  exportCurrentComparison() {
    // Try to get data from various possible sources
    let data = [];
    
    // Check if there's comparison data in localStorage
    const savedComparison = localStorage.getItem('akiprisaye_comparison');
    if (savedComparison) {
      try {
        data = JSON.parse(savedComparison);
      } catch (e) {
        console.warn('Could not parse saved comparison data');
      }
    }
    
    // If no saved data, try to extract from page
    if (data.length === 0) {
      data = this.extractDataFromPage();
    }
    
    // If still no data, create sample data
    if (data.length === 0) {
      data = this.getSampleData();
    }
    
    return data;
  }

  /**
   * Extract comparison data from current page
   */
  extractDataFromPage() {
    const data = [];
    
    // Try to find comparison tables or cards
    const comparisonElements = document.querySelectorAll('.comparison-item, .product-card, .price-item');
    
    comparisonElements.forEach(element => {
      const item = {};
      
      // Extract product name
      const nameEl = element.querySelector('.product-name, .item-name, h3, h4');
      if (nameEl) item.name = nameEl.textContent.trim();
      
      // Extract store name
      const storeEl = element.querySelector('.store-name, .enseigne, .shop');
      if (storeEl) item.store = storeEl.textContent.trim();
      
      // Extract price
      const priceEl = element.querySelector('.price, .prix, .cost');
      if (priceEl) {
        const priceText = priceEl.textContent.trim();
        const priceMatch = priceText.match(/[\d,\.]+/);
        if (priceMatch) {
          item.price = parseFloat(priceMatch[0].replace(',', '.'));
        }
      }
      
      // Extract zone
      const zoneEl = element.querySelector('.zone, .territoire, .location');
      if (zoneEl) item.zone = zoneEl.textContent.trim();
      
      if (item.name || item.store || item.price) {
        data.push(item);
      }
    });
    
    return data;
  }

  /**
   * Get sample data for demonstration
   */
  getSampleData() {
    return [
      {
        name: 'Riz Basmati 1kg',
        store: 'Carrefour',
        price: 3.45,
        zone: 'Guadeloupe',
        date: new Date().toLocaleDateString('fr-FR')
      },
      {
        name: 'Riz Basmati 1kg',
        store: 'Super U',
        price: 3.89,
        zone: 'Guadeloupe',
        date: new Date().toLocaleDateString('fr-FR')
      },
      {
        name: 'Pain de mie complet',
        store: 'Leader Price',
        price: 1.25,
        zone: 'Martinique',
        date: new Date().toLocaleDateString('fr-FR')
      }
    ];
  }

  /**
   * Add export buttons to comparison pages
   */
  addExportButtons() {
    // Check if we're on a comparison page
    const targetSelectors = ['.comparison-container', '.results-container', '.price-list', '#main-content'];
    let targetContainer = null;
    
    for (const selector of targetSelectors) {
      targetContainer = document.querySelector(selector);
      if (targetContainer) break;
    }
    
    if (!targetContainer) {
      targetContainer = document.body;
    }
    
    // Check if buttons already exist
    if (document.querySelector('.export-buttons')) {
      return;
    }
    
    // Create export buttons container
    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-buttons';
    exportContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
      display: flex;
      gap: 10px;
      background: rgba(15, 23, 42, 0.95);
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #334155;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    // Excel export button
    const excelBtn = document.createElement('button');
    excelBtn.innerHTML = '📊 Excel';
    excelBtn.style.cssText = `
      background: linear-gradient(135deg, #00e5ff, #00ff95);
      color: #081224;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 12px;
    `;
    excelBtn.onclick = () => {
      const data = this.exportCurrentComparison();
      this.exportToExcel(data);
    };
    
    // PDF export button
    const pdfBtn = document.createElement('button');
    pdfBtn.innerHTML = '📄 PDF';
    pdfBtn.style.cssText = excelBtn.style.cssText;
    pdfBtn.onclick = () => {
      const data = this.exportCurrentComparison();
      this.exportToPDF(data);
    };
    
    exportContainer.appendChild(excelBtn);
    exportContainer.appendChild(pdfBtn);
    
    document.body.appendChild(exportContainer);
  }
}

// Initialize export utilities
if (typeof window !== 'undefined') {
  window.ExportUtils = ExportUtils;
  
  // Auto-initialize on pages that might have comparison data
  document.addEventListener('DOMContentLoaded', function() {
    const exportUtils = new ExportUtils();
    
    // Add export buttons on relevant pages
    const currentPage = window.location.pathname;
    if (currentPage.includes('recherche') || 
        currentPage.includes('palmares') || 
        currentPage.includes('comparateur') ||
        currentPage.includes('compare')) {
      setTimeout(() => exportUtils.addExportButtons(), 2000);
    }
  });
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExportUtils;
}