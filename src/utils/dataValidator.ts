/**
 * Data Validator
 * 
 * Validation utilities for citizen contributions and form data.
 * Provides reusable validation functions for different data types.
 */

import type { 
  ValidationResult, 
  ValidationRule, 
  Territory 
} from '../types/comparatorCommon';
import { isValidTerritory } from './territoryMapper';

/**
 * Validate data against a set of rules
 * 
 * @param data - Data to validate
 * @param rules - Array of validation rules
 * @returns Validation result with errors if any
 */
export function validateContribution(
  data: Record<string, unknown>,
  rules: ValidationRule[]
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  for (const rule of rules) {
    const value = data[rule.field];
    let isValid = true;

    switch (rule.type) {
      case 'required':
        isValid = validateRequired(value);
        break;
      case 'format':
        isValid = validateFormat(value, rule.params as string);
        break;
      case 'range':
        isValid = validateRange(
          value as number,
          rule.params as { min?: number; max?: number }
        );
        break;
      case 'custom':
        isValid = (rule.params as (value: unknown) => boolean)(value);
        break;
    }

    if (!isValid) {
      errors.push({
        field: rule.field,
        message: rule.message,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required field
 * 
 * @param value - Value to check
 * @returns true if value is not null/undefined/empty
 */
function validateRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate format using regex or format type
 * 
 * @param value - Value to validate
 * @param format - Format type or regex pattern
 * @returns true if format is valid
 */
function validateFormat(value: unknown, format: string): boolean {
  if (typeof value !== 'string') return false;

  switch (format) {
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'phone':
      return /^(\+?\d{1,3})?[\s-]?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/.test(value);
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'date':
      return validateDate(value);
    default:
      // Assume it's a regex pattern
      try {
        return new RegExp(format).test(value);
      } catch {
        return false;
      }
  }
}

/**
 * Validate numeric range
 * 
 * @param value - Number to validate
 * @param params - Range parameters (min/max)
 * @returns true if value is within range
 */
function validateRange(
  value: number,
  params: { min?: number; max?: number }
): boolean {
  if (typeof value !== 'number' || !Number.isFinite(value)) return false;

  if (params.min !== undefined && value < params.min) return false;
  if (params.max !== undefined && value > params.max) return false;

  return true;
}

/**
 * Validate price value
 * 
 * @param price - Price to validate
 * @returns true if price is valid (positive finite number)
 */
export function validatePrice(price: number): boolean {
  return typeof price === 'number' && Number.isFinite(price) && price >= 0;
}

/**
 * Validate date string (ISO 8601 format)
 * 
 * @param date - Date string to validate
 * @returns true if date is valid
 */
export function validateDate(date: string): boolean {
  if (typeof date !== 'string') return false;

  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Validate territory code
 * 
 * @param territory - Territory code to validate
 * @returns true if territory code is valid
 */
export function validateTerritory(territory: string): boolean {
  return isValidTerritory(territory);
}

/**
 * Validate file upload
 * 
 * @param file - File to validate
 * @param maxSizeMB - Maximum file size in megabytes
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result
 */
export function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): ValidationResult {
  const errors: Array<{ field: string; message: string }> = [];

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push({
      field: 'file',
      message: `Le fichier dépasse la taille maximale de ${maxSizeMB} Mo`,
    });
  }

  // Check file type
  const isTypeAllowed = allowedTypes.some((type) => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return file.type.startsWith(category + '/');
    }
    return file.type === type;
  });

  if (!isTypeAllowed) {
    errors.push({
      field: 'file',
      message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 * 
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email address
 * 
 * @param email - Email to validate
 * @returns true if email is valid
 */
export function validateEmail(email: string): boolean {
  return validateFormat(email, 'email');
}

/**
 * Validate phone number
 * 
 * @param phone - Phone number to validate
 * @returns true if phone is valid
 */
export function validatePhone(phone: string): boolean {
  return validateFormat(phone, 'phone');
}

/**
 * Validate URL
 * 
 * @param url - URL to validate
 * @returns true if URL is valid
 */
export function validateUrl(url: string): boolean {
  return validateFormat(url, 'url');
}

/**
 * Validate postal code (French format)
 * 
 * @param postalCode - Postal code to validate
 * @returns true if postal code is valid
 */
export function validatePostalCode(postalCode: string): boolean {
  return /^\d{5}$/.test(postalCode);
}

/**
 * Validate SIRET number (French business identifier)
 * Uses the Luhn algorithm adapted for SIRET (alternating 2 and 1 from right to left)
 * 
 * @param siret - SIRET to validate
 * @returns true if SIRET is valid
 */
export function validateSiret(siret: string): boolean {
  const cleaned = siret.replace(/\s/g, '');
  if (!/^\d{14}$/.test(cleaned)) return false;

  // Luhn algorithm for SIRET: multiply by 2 or 1 alternating from right to left
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10);
    // For SIRET: multiply by 2 for even positions (from right), by 1 for odd positions
    // Position from right: 14-i-1
    const positionFromRight = 14 - i - 1;
    if (positionFromRight % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Create validation rules for a contribution form
 * 
 * @param fields - Array of field definitions
 * @returns Array of validation rules
 */
export function createValidationRules(
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    validation?: (value: unknown) => boolean;
  }>
): ValidationRule[] {
  return fields
    .filter((field) => field.required)
    .map((field) => {
      const rule: ValidationRule = {
        field: field.name,
        type: 'required',
        message: `Le champ "${field.name}" est requis`,
      };

      if (field.validation) {
        return {
          ...rule,
          type: 'custom',
          params: field.validation,
        };
      }

      return rule;
    });
}
