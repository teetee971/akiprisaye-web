import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const setDocMock = vi.fn(async () => undefined);
const docMock = vi.fn(() => ({ id: 'catalog-id' }));
const serverTimestampMock = vi.fn(() => 'SERVER_TS');

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

vi.mock('../lib/firebase', () => ({
  db: { __mock: true },
}));

import AdminCatalogImport from '../pages/admin/AdminCatalogImport';

describe('AdminCatalogImport', () => {
  beforeEach(() => {
    setDocMock.mockClear();
    docMock.mockClear();
    toastSuccessMock.mockClear();
    toastErrorMock.mockClear();
  });

  it('affiche une erreur quand le JSON est invalide', async () => {
    render(
      <HelmetProvider>
        <AdminCatalogImport />
      </HelmetProvider>
    );

    fireEvent.change(screen.getByLabelText(/JSON brut du catalogue/i), {
      target: { value: '{invalid json' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Analyser le catalogue/i }));

    expect(await screen.findByText(/JSON mal formaté/i)).toBeTruthy();
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it('publie en base après une analyse valide', async () => {
    render(
      <HelmetProvider>
        <AdminCatalogImport />
      </HelmetProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /Analyser le catalogue/i }));

    const publishButton = screen.getByRole('button', { name: /Publier en base de données/i });
    expect(publishButton).toBeTruthy();
    expect((publishButton as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(publishButton);

    await waitFor(() => {
      expect(setDocMock).toHaveBeenCalledTimes(1);
    });

    expect(docMock).toHaveBeenCalled();
  });
});
