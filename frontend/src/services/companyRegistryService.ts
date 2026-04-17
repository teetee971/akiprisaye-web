/**
 * Company Registry Service
 *
 * Centralized service for managing and accessing company data.
 * Supports lookup by any identifier: SIRET, SIREN, VAT, or internal ID.
 *
 * Key principle: ONE identifier is enough to retrieve full company information.
 */

import type { Company, CompanyLookupCriteria } from '../types/company';
import {
  isValidSiret,
  isValidSiren,
  isValidVat,
  normalizeSiret,
  normalizeSiren,
  normalizeVat,
} from '../utils/companyValidation';

/**
 * In-memory registry
 */
const companyRegistry: Map<string, Company> = new Map();

/**
 * Indexes
 */
const siretIndex: Map<string, string> = new Map(); // SIRET -> companyId
const sirenIndex: Map<string, Set<string>> = new Map(); // SIREN -> Set<companyId>
const vatIndex: Map<string, string> = new Map(); // VAT -> companyId

/* -------------------------------------------------------------------------- */
/*                                   WRITE                                    */
/* -------------------------------------------------------------------------- */

export function registerCompany(company: Company): void {
  companyRegistry.set(company.id, company);

  if (company.siretCode) {
    const siret = normalizeSiret(company.siretCode);
    if (siret) {
      siretIndex.set(siret, company.id);
    }
  }

  if (company.sirenCode) {
    const siren = normalizeSiren(company.sirenCode);
    if (siren) {
      const existing = sirenIndex.get(siren);
      if (existing) {
        existing.add(company.id);
      } else {
        sirenIndex.set(siren, new Set([company.id]));
      }
    }
  }

  if (company.vatCode) {
    const vat = normalizeVat(company.vatCode);
    if (vat) {
      vatIndex.set(vat, company.id);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   READ                                     */
/* -------------------------------------------------------------------------- */

export function getCompanyById(id: string): Company | null {
  return companyRegistry.get(id) ?? null;
}

export function getCompanyBySiret(siretCode: string): Company | null {
  if (!isValidSiret(siretCode)) return null;

  const siret = normalizeSiret(siretCode);
  if (!siret) return null;

  const id = siretIndex.get(siret);
  return id ? (companyRegistry.get(id) ?? null) : null;
}

export function getCompaniesBySiren(sirenCode: string): Company[] {
  if (!isValidSiren(sirenCode)) return [];

  const siren = normalizeSiren(sirenCode);
  if (!siren) return [];

  const idSet = sirenIndex.get(siren);
  if (!idSet) return [];

  return Array.from(idSet)
    .map((id) => companyRegistry.get(id))
    .filter((c): c is Company => Boolean(c));
}

export function getCompanyByVat(vatCode: string): Company | null {
  if (!isValidVat(vatCode)) return null;

  const vat = normalizeVat(vatCode);
  if (!vat) return null;

  const id = vatIndex.get(vat);
  return id ? (companyRegistry.get(id) ?? null) : null;
}

/**
 * Unified lookup entry point
 */
export function getCompany(identifier: string): Company | null {
  if (!identifier) return null;

  const byId = getCompanyById(identifier);
  if (byId) return byId;

  if (isValidSiret(identifier)) {
    const bySiret = getCompanyBySiret(identifier);
    if (bySiret) return bySiret;
  }

  if (isValidSiren(identifier)) {
    const companies = getCompaniesBySiren(identifier);
    if (companies.length > 0) {
      return companies.find((c) => c.siretCode?.endsWith('00001')) ?? companies[0];
    }
  }

  if (isValidVat(identifier)) {
    const byVat = getCompanyByVat(identifier);
    if (byVat) return byVat;
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*                                   SEARCH                                   */
/* -------------------------------------------------------------------------- */

export function searchCompanies(criteria: CompanyLookupCriteria): Company[] {
  if (criteria.internalId) {
    const c = getCompanyById(criteria.internalId);
    return c ? [c] : [];
  }

  if (criteria.siretCode) {
    const c = getCompanyBySiret(criteria.siretCode);
    return c ? [c] : [];
  }

  if (criteria.sirenCode) {
    return getCompaniesBySiren(criteria.sirenCode);
  }

  if (criteria.vatCode) {
    const c = getCompanyByVat(criteria.vatCode);
    return c ? [c] : [];
  }

  return Array.from(companyRegistry.values()).filter((company) => {
    let ok = true;

    if (criteria.legalName) {
      const q = criteria.legalName.toLowerCase();
      ok =
        ok &&
        (company.legalName.toLowerCase().includes(q) ||
          (company.tradeName?.toLowerCase().includes(q) ?? false));
    }

    if (criteria.territory) {
      ok =
        ok &&
        company.headOffice.department.toLowerCase().includes(criteria.territory.toLowerCase());
    }

    return ok;
  });
}

/* -------------------------------------------------------------------------- */
/*                                   HELPERS                                  */
/* -------------------------------------------------------------------------- */

export function getAllCompanies(): Company[] {
  return Array.from(companyRegistry.values());
}

export function getCompanyCount(): number {
  return companyRegistry.size;
}

export function clearCompanyRegistry(): void {
  companyRegistry.clear();
  siretIndex.clear();
  sirenIndex.clear();
  vatIndex.clear();
}

export function isCompanyActive(company: Company): boolean {
  return company.activityStatus === 'ACTIVE';
}

export function getEstablishments(sirenCode: string): Company[] {
  return getCompaniesBySiren(sirenCode);
}

export function getHeadquarters(sirenCode: string): Company | null {
  return getCompaniesBySiren(sirenCode).find((c) => c.siretCode?.endsWith('00001')) ?? null;
}
