// Enhanced OCR parser for multi-product/store tickets
// Supports better parsing of complex tickets from DOM-TOM stores

export class TicketParser {
  constructor() {
    // Common store names in DOM-TOM
    this.storePatterns = [
      /(?:super\s*u|hyper\s*u)/i,
      /(?:carrefour|carour)/i,
      /(?:géant|geant)/i,
      /(?:leader\s*price|leader)/i,
      /(?:eco\s*max|ecomax)/i,
      /(?:champion|shopi)/i,
      /(?:marché\s*frais|marche)/i,
      /(?:score|spar|8\s*à\s*huit)/i
    ];

    // Price patterns
    this.pricePatterns = [
      /(\d+)[,.](\d{2})\s*[€$]/g,
      /(\d+)[,.](\d{2})\s*EUR/gi,
      /€\s*(\d+)[,.](\d{2})/g,
      /(\d+)[,.](\d{2})/g
    ];

    // Product line patterns
    this.productPatterns = [
      /^(.+?)\s+(\d+[,.]\d{2})\s*[€$]?$/,
      /^(.+?)\s+x\d+\s+(\d+[,.]\d{2})\s*[€$]?$/,
      /^(.+?)\s+(\d+[,.]\d{2})\s*EUR?$/i
    ];

    // Common DOM-TOM products
    this.productKeywords = [
      'banane', 'ananas', 'mangue', 'coco', 'papaye', 'goyave',
      'riz', 'haricot', 'igname', 'patate', 'manioc', 'christophine',
      'poisson', 'lambi', 'crabe', 'crevette', 'ouassou',
      'rhum', 'punch', 'ti-punch', 'planteur'
    ];
  }

  parseTicketText(ocrText) {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);
    
    const result = {
      store: this.extractStoreName(lines),
      date: this.extractDate(lines),
      products: this.extractProducts(lines),
      total: this.extractTotal(lines),
      rawText: ocrText,
      confidence: 0
    };

    // Calculate confidence based on extracted data
    result.confidence = this.calculateConfidence(result);
    
    return result;
  }

  extractStoreName(lines) {
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      for (const pattern of this.storePatterns) {
        const match = line.match(pattern);
        if (match) {
          return this.cleanStoreName(match[0]);
        }
      }
    }
    return 'Magasin inconnu';
  }

  cleanStoreName(name) {
    return name.trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  extractDate(lines) {
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
      /(\d{1,2})\s*(jan|fév|feb|mar|avr|apr|mai|may|jun|jui|jul|aoû|aug|sep|oct|nov|déc|dec)\s*(\d{2,4})/i
    ];

    for (const line of lines) {
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          return this.normalizeDate(match[0]);
        }
      }
    }
    return new Date().toISOString().split('T')[0];
  }

  normalizeDate(dateStr) {
    try {
      // Handle different date formats
      const date = new Date(dateStr.replace(/[\/\-.]/g, '/'));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Fallback to current date
    }
    return new Date().toISOString().split('T')[0];
  }

  extractProducts(lines) {
    const products = [];
    let inProductSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip header lines (store name, address, etc.)
      if (i < 3 && this.isHeaderLine(line)) continue;
      
      // Skip footer lines (total, payment, etc.)
      if (this.isFooterLine(line)) break;

      const product = this.parseProductLine(line);
      if (product) {
        // Enhance product with DOM-TOM specific data
        product.category = this.categorizeProduct(product.name);
        product.isLocal = this.isLocalProduct(product.name);
        products.push(product);
        inProductSection = true;
      }
    }

    return products;
  }

  parseProductLine(line) {
    // Try different product line patterns
    for (const pattern of this.productPatterns) {
      const match = line.match(pattern);
      if (match) {
        const name = match[1].trim();
        const priceStr = match[2].replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (name.length > 2 && !isNaN(price) && price > 0) {
          return {
            name: this.cleanProductName(name),
            price: price,
            rawLine: line
          };
        }
      }
    }

    // Fallback: look for any price in the line
    const prices = this.extractPricesFromLine(line);
    if (prices.length > 0) {
      const productName = line.replace(/\d+[,.]\d{2}\s*[€$]?/g, '').trim();
      if (productName.length > 2) {
        return {
          name: this.cleanProductName(productName),
          price: prices[0],
          rawLine: line
        };
      }
    }

    return null;
  }

  extractPricesFromLine(line) {
    const prices = [];
    for (const pattern of this.pricePatterns) {
      const matches = [...line.matchAll(pattern)];
      for (const match of matches) {
        let price;
        if (match[1] && match[2]) {
          price = parseFloat(`${match[1]}.${match[2]}`);
        } else if (match[0]) {
          price = parseFloat(match[0].replace(',', '.').replace(/[€$]/g, ''));
        }
        if (!isNaN(price) && price > 0) {
          prices.push(price);
        }
      }
    }
    return prices;
  }

  cleanProductName(name) {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/^[*\-•]\s*/, '') // Remove bullet points
      .toLowerCase();
  }

  categorizeProduct(productName) {
    const name = productName.toLowerCase();
    
    if (/banane|ananas|mangue|coco|papaye|goyave|fruit/i.test(name)) {
      return 'fruits';
    }
    if (/riz|haricot|légume|igname|patate|manioc|christophine/i.test(name)) {
      return 'légumes/féculents';
    }
    if (/poisson|lambi|crabe|crevette|ouassou|viande/i.test(name)) {
      return 'protéines';
    }
    if (/rhum|punch|boisson|eau|jus/i.test(name)) {
      return 'boissons';
    }
    if (/pain|farine|sucre|huile/i.test(name)) {
      return 'épicerie';
    }
    
    return 'autres';
  }

  isLocalProduct(productName) {
    const name = productName.toLowerCase();
    return this.productKeywords.some(keyword => name.includes(keyword));
  }

  isHeaderLine(line) {
    const headerPatterns = [
      /^(super|hyper|carrefour|géant|leader|eco)/i,
      /^(tel|téléphone|phone)[:.]?\s*\d/i,
      /^(adresse|address|rue|avenue)/i,
      /siret|siren|rcs/i
    ];
    
    return headerPatterns.some(pattern => pattern.test(line));
  }

  isFooterLine(line) {
    const footerPatterns = [
      /^(total|sous.?total|montant)/i,
      /^(tva|tax|espèces|carte|cb)/i,
      /^(rendu|change|monnaie)/i,
      /merci|thank/i,
      /^(ticket|facture|n°)/i
    ];
    
    return footerPatterns.some(pattern => pattern.test(line));
  }

  extractTotal(lines) {
    // Look for total in last few lines
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
      const line = lines[i];
      if (/total/i.test(line)) {
        const prices = this.extractPricesFromLine(line);
        if (prices.length > 0) {
          return Math.max(...prices); // Get the highest price (likely the total)
        }
      }
    }
    return null;
  }

  calculateConfidence(result) {
    let confidence = 0;
    
    // Store name found
    if (result.store && result.store !== 'Magasin inconnu') confidence += 25;
    
    // Products found
    if (result.products.length > 0) confidence += 30;
    if (result.products.length > 3) confidence += 10;
    
    // Total found
    if (result.total) confidence += 15;
    
    // Date found
    if (result.date) confidence += 10;
    
    // Local products identified
    const localProducts = result.products.filter(p => p.isLocal).length;
    if (localProducts > 0) confidence += Math.min(10, localProducts * 2);
    
    return Math.min(100, confidence);
  }

  // Generate summary for display
  generateSummary(result) {
    const summary = {
      store: result.store,
      date: result.date,
      itemCount: result.products.length,
      total: result.total,
      confidence: result.confidence,
      localProducts: result.products.filter(p => p.isLocal).length,
      categories: [...new Set(result.products.map(p => p.category))]
    };
    
    return summary;
  }
}

export const ticketParser = new TicketParser();