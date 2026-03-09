 
/**
 * Excel Exporter Utility
 * Export price comparisons, shopping lists, and inflation reports to Excel
 * Using ExcelJS for secure, vulnerability-free Excel generation
 */

import ExcelJS from 'exceljs';

interface Product {
  ean?: string;
  name: string;
  price: number;
  store?: string;
  territory?: string;
  [key: string]: any;
}

export class ExcelExporter {
  /**
   * Export price comparison to Excel
   */
  async exportPriceComparison(products: Product[]): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    // Price comparison sheet
    const worksheet = workbook.addWorksheet('Comparaison Prix');
    worksheet.columns = [
      { header: 'Code EAN', key: 'ean', width: 15 },
      { header: 'Produit', key: 'name', width: 30 },
      { header: 'Prix (€)', key: 'price', width: 12 },
      { header: 'Magasin', key: 'store', width: 25 },
      { header: 'Territoire', key: 'territory', width: 15 }
    ];

    products.forEach(p => {
      worksheet.addRow({
        ean: p.ean || 'N/A',
        name: p.name,
        price: p.price.toFixed(2),
        store: p.store || 'N/A',
        territory: p.territory || 'N/A'
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };

    // Summary statistics sheet
    const avgPrice = products.reduce((sum, p) => sum + p.price, 0) / products.length;
    const minPrice = Math.min(...products.map(p => p.price));
    const maxPrice = Math.max(...products.map(p => p.price));

    const summarySheet = workbook.addWorksheet('Statistiques');
    summarySheet.columns = [
      { header: 'Statistique', key: 'stat', width: 20 },
      { header: 'Valeur', key: 'value', width: 15 }
    ];

    summarySheet.addRows([
      { stat: 'Prix Minimum', value: `${minPrice.toFixed(2)}€` },
      { stat: 'Prix Maximum', value: `${maxPrice.toFixed(2)}€` },
      { stat: 'Prix Moyen', value: `${avgPrice.toFixed(2)}€` },
      { stat: 'Écart', value: `${(maxPrice - minPrice).toFixed(2)}€` }
    ]);

    summarySheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Export shopping list to Excel
   */
  async exportShoppingList(list: any): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    
    const worksheet = workbook.addWorksheet('Liste de Courses');
    worksheet.columns = [
      { header: 'Produit', key: 'name', width: 30 },
      { header: 'Code EAN', key: 'ean', width: 15 },
      { header: 'Quantité', key: 'quantity', width: 12 },
      { header: 'Catégorie', key: 'category', width: 20 },
      { header: 'Priorité', key: 'priority', width: 12 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    list.items.forEach((item: any) => {
      worksheet.addRow({
        name: item.productName,
        ean: item.productEAN,
        quantity: item.quantity,
        category: item.category,
        priority: item.priority,
        notes: item.notes || ''
      });
    });

    worksheet.getRow(1).font = { bold: true };

    // Add optimization results if available
    if (list.optimization) {
      const opt = list.optimization;
      const optSheet = workbook.addWorksheet('Optimisation');
      optSheet.columns = [
        { header: 'Magasin', key: 'store', width: 30 },
        { header: 'Nombre d\'articles', key: 'count', width: 20 },
        { header: 'Sous-total (€)', key: 'subtotal', width: 15 }
      ];

      opt.stores.forEach((store: any) => {
        optSheet.addRow({
          store: store.storeName,
          count: store.items.length,
          subtotal: store.subtotal.toFixed(2)
        });
      });

      optSheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Export inflation report to Excel
   */
  async exportInflationReport(data: any): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();

    // Overview sheet
    const overviewSheet = workbook.addWorksheet('Vue d\'ensemble');
    overviewSheet.columns = [
      { header: 'Territoire', key: 'territory', width: 20 },
      { header: 'Taux d\'inflation (%)', key: 'rate', width: 20 },
      { header: 'Écart métropole (%)', key: 'gap', width: 20 },
      { header: 'Dernière mise à jour', key: 'updated', width: 20 }
    ];

    data.territories.forEach((t: any) => {
      overviewSheet.addRow({
        territory: t.territoryName,
        rate: t.overallInflationRate.toFixed(2),
        gap: t.comparedToMetropole?.toFixed(2) || 'N/A',
        updated: new Date(t.lastUpdated).toLocaleDateString('fr-FR')
      });
    });

    overviewSheet.getRow(1).font = { bold: true };

    // Category details for each territory
    data.territories.forEach((territory: any) => {
      const sheetName = territory.territoryName.substring(0, 31); // Excel limit
      const categorySheet = workbook.addWorksheet(sheetName);
      
      categorySheet.columns = [
        { header: 'Catégorie', key: 'category', width: 20 },
        { header: 'Prix Moyen Actuel (€)', key: 'current', width: 22 },
        { header: 'Prix Moyen Précédent (€)', key: 'previous', width: 25 },
        { header: 'Taux d\'inflation (%)', key: 'rate', width: 20 },
        { header: 'Changement (€)', key: 'change', width: 18 }
      ];

      territory.categories.forEach((cat: any) => {
        categorySheet.addRow({
          category: cat.category,
          current: cat.currentAverage.toFixed(2),
          previous: cat.previousAverage.toFixed(2),
          rate: cat.inflationRate.toFixed(2),
          change: cat.priceChange.toFixed(2)
        });
      });

      categorySheet.getRow(1).font = { bold: true };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  /**
   * Trigger download of Excel file
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper to export and trigger download
   */
  async exportAndDownload(
    type: 'priceComparison' | 'shoppingList' | 'inflationReport',
    data: any,
    filename: string
  ): Promise<void> {
    let blob: Blob;
    
    switch (type) {
      case 'priceComparison':
        blob = await this.exportPriceComparison(data);
        break;
      case 'shoppingList':
        blob = await this.exportShoppingList(data);
        break;
      case 'inflationReport':
        blob = await this.exportInflationReport(data);
        break;
    }
    
    this.downloadBlob(blob, filename);
  }
}

export const excelExporter = new ExcelExporter();
