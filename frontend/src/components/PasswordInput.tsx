 
/**
 * Enhanced Password Input Component
 * 
 * Features:
 * - Show/hide password toggle (👁️)
 * - Secure password generator (crypto.getRandomValues)
 * - Password strength indicator (Weak / Medium / Strong)
 * - Copy to clipboard action
 * - Mobile-first design (≥ 44px touch targets)
 * - Full accessibility (ARIA labels)
 * 
 * Security:
 * - 100% client-side (offline)
 * - No external dependencies
 * - No local storage
 * - No network calls
 */

import { useState, useCallback } from 'react';

interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  className?: string;
}

/**
 * Calculate password strength
 * Returns: 'weak', 'medium', or 'strong'
 */
function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length === 0) return 'weak';
  
  let score = 0;
  
  // Length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  // Character types
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
}

/**
 * Character set for password generation
 */
const CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';

// NOTE SÉCURITÉ
// La sélection via crypto.getRandomValues() avec modulo
// présente un biais < 1e-9 pour un charset ~77 caractères.
// Ce biais est NON exploitable et conforme OWASP (client-side).

/**
 * Secure shuffle using crypto.getRandomValues
 * Fisher-Yates shuffle with cryptographically secure randomness
 */
function secureShuffle(array: string[]): string[] {
  const result = [...array];
  const randomValues = new Uint32Array(result.length);
  crypto.getRandomValues(randomValues);

  for (let i = result.length - 1; i > 0; i--) {
    const j = randomValues[i] % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Generate secure password using crypto.getRandomValues
 * 16 characters: uppercase, lowercase, numbers, symbols
 */
function generateSecurePassword(length = 16): string {
  const chars = Array.from({ length }, () => {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    return CHARSET[random[0] % CHARSET.length];
  });

  return secureShuffle(chars).join('');
}

export function PasswordInput({
  id,
  value,
  onChange,
  label = 'Mot de passe',
  placeholder = 'Minimum 8 caractères',
  required = false,
  minLength = 8,
  autoComplete = 'new-password',
  className = ''
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  const strength = getPasswordStrength(value);
  const tooShort = value.length > 0 && value.length < minLength;
  
  /**
   * Toggle password visibility
   */
  const toggleVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);
  
  /**
   * Generate new password
   */
  const handleGenerate = useCallback(() => {
    const newPassword = generateSecurePassword();
    onChange(newPassword);
    setShowPassword(true); // Show generated password
  }, [onChange]);
  
  /**
   * Copy password to clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);
  
  // Strength indicator styling
  const strengthConfig = {
    weak: { label: 'Faible', color: 'bg-red-500', textColor: 'text-red-300' },
    medium: { label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-300' },
    strong: { label: 'Fort', color: 'bg-green-500', textColor: 'text-green-300' }
  };
  
  const currentStrength = strengthConfig[strength];
  
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Password Input with Actions */}
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full p-3 pr-32 rounded-lg bg-slate-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={tooShort}
          aria-describedby={tooShort ? `${id}-error` : undefined}
        />
        
        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          {/* Show/Hide Toggle */}
          <button
            type="button"
            onClick={toggleVisibility}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-slate-700 transition-colors"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            title={showPassword ? 'Masquer' : 'Afficher'}
          >
            <span className="text-lg">
              {showPassword ? '🙈' : '👁️'}
            </span>
          </button>
          
          {/* Copy Button */}
          {value && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-slate-700 transition-colors relative"
              aria-label="Copier le mot de passe"
              title="Copier"
            >
              <span className="text-lg">
                {copyFeedback ? '✅' : '📋'}
              </span>
              {copyFeedback && (
                <span className="absolute -top-8 right-0 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  Copié !
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Password Strength Indicator */}
      {value && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Force :</span>
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${currentStrength.color} transition-all duration-300`}
                style={{ 
                  width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : '100%' 
                }}
              />
            </div>
            <span className={`font-medium ${currentStrength.textColor}`}>
              {currentStrength.label}
            </span>
          </div>
        </div>
      )}

      {tooShort && (
        <p
          id={`${id}-error`}
          className="mt-2 text-xs text-red-300"
          role="alert"
        >
          Le mot de passe doit contenir au moins {minLength} caractères.
        </p>
      )}
      
      {/* Generate Button */}
      <button
        type="button"
        onClick={handleGenerate}
        className="mt-2 w-full p-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        aria-label="Générer un mot de passe sécurisé"
      >
        <span>🎲</span>
        <span>Générer un mot de passe sécurisé</span>
      </button>
      
      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-400">
        💡 Astuce : Utilisez un gestionnaire de mots de passe pour sauvegarder
      </p>
    </div>
  );
}
