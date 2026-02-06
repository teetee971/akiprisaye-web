import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// eslint-disable-next-line no-unused-vars -- Component is used in render() call below
import SignalementForm from '../SignalementForm';

describe('SignalementForm', () => {
  beforeEach(() => {
    vi.stubGlobal('UploadPreuve', () => null);
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders form with all required fields', () => {
    render(<SignalementForm />);
    
    expect(screen.getByText('📝 Signaler un prix observé')).toBeDefined();
    expect(screen.getByLabelText(/Territoire/)).toBeDefined();
    expect(screen.getByLabelText(/Nom du magasin/)).toBeDefined();
    expect(screen.getByLabelText(/Produit/)).toBeDefined();
    expect(screen.getByLabelText(/Prix observé/)).toBeDefined();
  });

  it('displays legal warning', () => {
    render(<SignalementForm />);
    
    expect(screen.getByText(/observation ponctuelle/)).toBeDefined();
    expect(screen.getByText(/pas publiées automatiquement/)).toBeDefined();
  });

  it('validates required fields', () => {
    render(<SignalementForm />);
    
    const continueButton = screen.getByText('Continuer →');
    fireEvent.click(continueButton);
    
    expect(screen.getByText(/magasin est obligatoire/)).toBeDefined();
    expect(screen.getByText(/produit est obligatoire/)).toBeDefined();
  });
});
