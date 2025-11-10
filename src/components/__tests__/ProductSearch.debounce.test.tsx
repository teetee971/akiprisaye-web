import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, fireEvent } from '@testing-library/react';
import ProductSearch from '../ProductSearch';

describe('ProductSearch - Debounce Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should not make network requests when query length < 3 characters', async () => {
    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type 1 character
    fireEvent.change(input, { target: { value: 'a' } });
    await vi.advanceTimersByTimeAsync(250);
    expect(global.fetch).not.toHaveBeenCalled();

    // Type 2 characters
    fireEvent.change(input, { target: { value: 'ab' } });
    await vi.advanceTimersByTimeAsync(250);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should trigger debounced request after 250ms of inactivity', async () => {
    const mockProducts = [
      { ean: '123', name: 'Test Product', brand: 'Test Brand', image: '/test.jpg' },
    ];
    global.fetch.mockResolvedValueOnce({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type query >= 3 characters
    fireEvent.change(input, { target: { value: 'riz' } });

    // Before 250ms - no fetch yet
    await vi.advanceTimersByTimeAsync(200);
    expect(global.fetch).not.toHaveBeenCalled();

    // After 250ms - fetch should be called
    await vi.advanceTimersByTimeAsync(50);
    
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products/search?q=riz&territory=Guadeloupe'
      );
    });
  });

  it('should cancel pending calls when new input arrives before 250ms', async () => {
    const mockProducts = [
      { ean: '456', name: 'Rice Product', brand: 'Rice Brand', image: '/rice.jpg' },
    ];
    global.fetch.mockResolvedValue({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type "riz"
    fireEvent.change(input, { target: { value: 'riz' } });
    
    // Wait 100ms (less than debounce time)
    await vi.advanceTimersByTimeAsync(100);
    expect(global.fetch).not.toHaveBeenCalled();

    // Type more characters before debounce completes
    fireEvent.change(input, { target: { value: 'riz basmati' } });
    
    // Wait another 100ms (still not reached 250ms since last input)
    await vi.advanceTimersByTimeAsync(100);
    expect(global.fetch).not.toHaveBeenCalled();

    // Now wait full 250ms from last input
    await vi.advanceTimersByTimeAsync(150);
    
    await vi.waitFor(() => {
      // Should only be called once with the full query
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products/search?q=riz%20basmati&territory=Guadeloupe'
      );
    });
  });

  it('should clear results when query is shortened to < 3 characters', async () => {
    const mockProducts = [
      { ean: '789', name: 'Pasta Product', brand: 'Pasta Brand', image: '/pasta.jpg' },
    ];
    global.fetch.mockResolvedValue({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type a query >= 3 characters
    fireEvent.change(input, { target: { value: 'pates' } });
    
    // Wait for debounce
    await vi.advanceTimersByTimeAsync(250);
    
    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Wait for results to render
    await vi.waitFor(() => {
      expect(screen.getByText('Pasta Product')).toBeInTheDocument();
    });

    // Clear input to < 3 characters
    fireEvent.change(input, { target: { value: 'pa' } });

    // Results should be cleared immediately (no debounce needed for clearing)
    await vi.waitFor(() => {
      expect(screen.queryByText('Pasta Product')).not.toBeInTheDocument();
    });

    // No additional fetch should be made
    await vi.advanceTimersByTimeAsync(250);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still only the first call
  });

  it('should use correct territory in API call', async () => {
    global.fetch.mockResolvedValue({
      json: async () => [],
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Martinique" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);
    fireEvent.change(input, { target: { value: 'lait' } });
    await vi.advanceTimersByTimeAsync(250);

    await vi.waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products/search?q=lait&territory=Martinique'
      );
    });
  });
});
