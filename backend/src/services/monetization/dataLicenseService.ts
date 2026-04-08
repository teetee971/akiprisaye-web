/**
 * Data License Service
 *
 * Génération et livraison des rapports de données sous licence.
 * Types : Rapport mensuel inflation (50€), Territory Intelligence (100€),
 * Export personnalisé (variable), Licence académique (gratuit/sponsorisé).
 */

export type ReportType =
  | 'monthly_inflation'
  | 'territory_intelligence'
  | 'custom_export'
  | 'academic_license';

export interface DataReport {
  id: string;
  type: ReportType;
  title: string;
  description: string;
  price: number;
  deliveryFormat: string[];
  deliveryTime: string;
  available: boolean;
}

export interface ReportOrder {
  reportType: ReportType;
  period?: string;
  territory?: string;
  categories?: string[];
  email: string;
  organizationName?: string;
}

export const DATA_REPORTS: DataReport[] = [
  {
    id: 'monthly-inflation',
    type: 'monthly_inflation',
    title: 'Rapport Mensuel Inflation',
    description:
      'Prix moyen par région, tendances 6 mois, top produits impactés. Idéal pour collectivités et médias.',
    price: 50,
    deliveryFormat: ['PDF', 'Excel'],
    deliveryTime: 'Livré le 1er du mois',
    available: true,
  },
  {
    id: 'territory-intelligence',
    type: 'territory_intelligence',
    title: 'Territory Intelligence DOM-TOM',
    description:
      'Analyse de marché par territoire, benchmarking concurrentiel, insights locaux.',
    price: 100,
    deliveryFormat: ['PDF', 'Excel', 'HTML interactif'],
    deliveryTime: 'Livré sous 48h',
    available: true,
  },
  {
    id: 'custom-export',
    type: 'custom_export',
    title: 'Export Personnalisé',
    description:
      'Période, région, catégories au choix. Livraison par email + dashboard interactif.',
    price: 0, // Variable pricing
    deliveryFormat: ['PDF', 'Excel', 'JSON', 'CSV'],
    deliveryTime: 'Généré en <2 minutes',
    available: true,
  },
  {
    id: 'academic-license',
    type: 'academic_license',
    title: 'Licence Académique',
    description:
      'Datasets anonymisés pour universités et instituts de recherche. Accès gratuit avec convention.',
    price: 0,
    deliveryFormat: ['CSV', 'JSON', 'Parquet'],
    deliveryTime: 'Accès immédiat',
    available: true,
  },
];

export class DataLicenseService {
  static getAvailableReports(): DataReport[] {
    return DATA_REPORTS.filter((r) => r.available);
  }

  static getReportById(id: string): DataReport | undefined {
    return DATA_REPORTS.find((r) => r.id === id);
  }

  static getReportByType(type: ReportType): DataReport | undefined {
    return DATA_REPORTS.find((r) => r.type === type);
  }

  /**
   * Compute custom export price based on data scope.
   */
  static computeCustomExportPrice(params: {
    months: number;
    territories: number;
    categories: number;
  }): number {
    const base = 10;
    const territoryMultiplier = params.territories * 5;
    const periodMultiplier = params.months * 2;
    const categoryMultiplier = params.categories * 1;
    return Math.max(base + territoryMultiplier + periodMultiplier + categoryMultiplier, 15);
  }

  /**
   * Anonymize dataset for academic use — removes all user PII.
   */
  static anonymizeForAcademic<T extends Record<string, unknown>>(
    records: T[],
    piiFields: string[] = ['userId', 'email', 'phone', 'name']
  ): Partial<T>[] {
    return records.map((record) => {
      const cleaned = { ...record };
      piiFields.forEach((field) => {
        if (field in cleaned) {
          delete cleaned[field];
        }
      });
      return cleaned;
    });
  }

  /**
   * Generate cron schedule for automatic weekly reports.
   * Every Sunday at 23:00 (Europe/Paris).
   */
  static getScheduleCron(): string {
    return '0 23 * * 0';
  }

  /**
   * Validate a report order.
   * Email check uses a linear string-split approach to avoid ReDoS risks.
   */
  static validateOrder(order: ReportOrder): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    // Safe email validation — split on '@', no backtracking regex
    const emailParts = order.email ? order.email.split('@') : [];
    const emailValid =
      emailParts.length === 2 &&
      emailParts[0].length > 0 &&
      emailParts[1].includes('.') &&
      !emailParts[1].startsWith('.') &&
      !emailParts[1].endsWith('.');
    if (!emailValid) {
      errors.push('Email invalide');
    }
    if (!order.reportType) {
      errors.push('Type de rapport requis');
    }
    const report = this.getReportByType(order.reportType);
    if (!report) {
      errors.push('Type de rapport inconnu');
    }
    return { valid: errors.length === 0, errors };
  }
}
