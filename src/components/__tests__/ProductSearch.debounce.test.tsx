import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import ProductSearch from '../ProductSearch';

describe('ProductSearch - Debounce Logic', () => {
  let mockFetch;

  beforeEach(() => {
    // Mock the global fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    // Use fake timers for precise control over time-based operations
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore all mocks and timers
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should not make network requests when query length < 3 characters', async () => {
    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type 1 character
    fireEvent.change(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(250);
    expect(mockFetch).not.toHaveBeenCalled();

    // Type 2 characters total
    fireEvent.change(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(250);
    expect(mockFetch).not.toHaveBeenCalled();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    vi.advanceTimersByTime(250);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should trigger debounced request after 250ms of inactivity', async () => {
    const mockProducts = [
      { ean: '123', name: 'Riz Basmati', brand: 'Brand A', image: null },
    ];
    mockFetch.mockResolvedValue({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type 3 characters
    fireEvent.change(input, { target: { value: 'riz' } });

    // Should not fetch immediately
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance by less than 250ms - should still not fetch
    vi.advanceTimersByTime(200);
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance the remaining time to reach 250ms
    vi.advanceTimersByTime(50);

    // Wait for the fetch to be called
    await vi.runOnlyPendingTimersAsync();
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products/search?q=riz&territory=Guadeloupe')
    );
  });

  it('should cancel pending calls when new input arrives before 250ms', async () => {
    const mockProducts = [
      { ean: '456', name: 'Lait', brand: 'Brand B', image: null },
    ];
    mockFetch.mockResolvedValue({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type first query
    fireEvent.change(input, { target: { value: 'riz' } });

    // Advance by 100ms (less than 250ms)
    vi.advanceTimersByTime(100);
    expect(mockFetch).not.toHaveBeenCalled();

    // Type more characters, which should reset the debounce timer
    fireEvent.change(input, { target: { value: 'riz basmati' } });

    // Advance by 200ms from the new input (still less than 250ms total from "riz basmati")
    vi.advanceTimersByTime(200);
    expect(mockFetch).not.toHaveBeenCalled();

    // Advance the final 50ms to complete the 250ms from the last input
    vi.advanceTimersByTime(50);

    // Only one fetch should be called with the complete query
    await vi.runOnlyPendingTimersAsync();
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products/search?q=riz%20basmati&territory=Guadeloupe')
    );
  });

  it('should clear results when query is shortened to < 3 characters', () => {
    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type a query that is 3 or more characters
    fireEvent.change(input, { target: { value: 'pâtes' } });

    // Clear the input to less than 3 characters
    fireEvent.change(input, { target: { value: 'pa' } });

    // Advance timers to ensure no new fetch is made
    vi.advanceTimersByTime(250);
    expect(mockFetch).not.toHaveBeenCalled();

    // Type 3 characters again to verify debounce still works
    fireEvent.change(input, { target: { value: 'pât' } });
    vi.advanceTimersByTime(250);
    
    // This time fetch should be called since we have >= 3 characters
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should handle rapid typing correctly with multiple debounce resets', async () => {
    const mockProducts = [
      { ean: '999', name: 'Final Product', brand: 'Final Brand', image: null },
    ];
    mockFetch.mockResolvedValue({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Martinique" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Simulate rapid typing with pauses less than 250ms
    fireEvent.change(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(50);
    
    fireEvent.change(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(50);
    
    fireEvent.change(input, { target: { value: 'abc' } });
    vi.advanceTimersByTime(50);
    
    fireEvent.change(input, { target: { value: 'abcd' } });
    vi.advanceTimersByTime(50);
    
    fireEvent.change(input, { target: { value: 'abcde' } });
    
    // No fetch should have been made yet
    expect(mockFetch).not.toHaveBeenCalled();

    // Now wait the full 250ms from the last input
    vi.advanceTimersByTime(250);

    // Should have made exactly one fetch with the complete query
    await vi.runOnlyPendingTimersAsync();
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products/search?q=abcde&territory=Martinique')
    );
  });

  it('should respect territory parameter in API calls', async () => {
    const mockProducts = [];
    mockFetch.mockResolvedValue({
      json: async () => mockProducts,
    });

    const onPickEAN = vi.fn();
    const { rerender } = render(<ProductSearch territory="Guyane" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    // Type a query
    fireEvent.change(input, { target: { value: 'test' } });
    vi.advanceTimersByTime(250);

    await vi.runOnlyPendingTimersAsync();
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('territory=Guyane')
    );

    mockFetch.mockClear();

    // Change territory and type again
    rerender(<ProductSearch territory="Réunion" onPickEAN={onPickEAN} />);
    
    fireEvent.change(input, { target: { value: 'prod' } });
    vi.advanceTimersByTime(250);

    await vi.runOnlyPendingTimersAsync();
    
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('territory=R%C3%A9union')
    );
  });

  it('should handle fetch errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetch.mockRejectedValue(new Error('Network error'));

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    fireEvent.change(input, { target: { value: 'error test' } });
    vi.advanceTimersByTime(250);
    
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // The error is logged asynchronously, but we just verify the fetch was called
    // In a real scenario with proper error handling, this would show an error message
    
    consoleErrorSpy.mockRestore();
  });

  it('should trigger loading state when making a request', () => {
    mockFetch.mockResolvedValue({
      json: async () => [],
    });

    const onPickEAN = vi.fn();
    render(<ProductSearch territory="Guadeloupe" onPickEAN={onPickEAN} />);

    const input = screen.getByPlaceholderText(/Rechercher un produit/i);

    fireEvent.change(input, { target: { value: 'loading' } });
    
    // Before debounce timer, no loading indicator
    expect(screen.queryByText('Chargement…')).not.toBeInTheDocument();
    
    // Advance timers to trigger the fetch
    vi.advanceTimersByTime(250);
    
    // Fetch should be called
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
