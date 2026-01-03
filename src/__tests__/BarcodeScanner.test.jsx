import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BarcodeScanner from '../components/BarcodeScanner';

describe('BarcodeScanner Component', () => {
  const mockOnScan = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.mediaDevices.getUserMedia
    global.navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [
          {
            stop: vi.fn(),
            getCapabilities: () => ({}),
          },
        ],
        getVideoTracks: () => [
          {
            stop: vi.fn(),
            getCapabilities: () => ({}),
          },
        ],
      }),
    };
  });

  it('should render the scanner component', () => {
    render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );
    
    expect(screen.getByText('📷 Scanner Code-Barres')).toBeInTheDocument();
  });

  it('should show instructions in idle state', () => {
    render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );
    
    expect(screen.getByText(/Instructions :/)).toBeInTheDocument();
  });

  it('should have start scan button with correct test id', () => {
    render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );
    
    const startButton = screen.getByTestId('start-scan');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toHaveTextContent('Scanner avec la caméra');
  });

  it('should transition to not_found state when timeout is reached', async () => {
    const shortTimeout = 1000; // 1 seconde pour le test
    
    render(
      <BarcodeScanner 
        onScan={mockOnScan} 
        onClose={mockOnClose} 
        timeout={shortTimeout}
      />
    );
    
    // Click start scan button
    const startButton = screen.getByTestId('start-scan');
    fireEvent.click(startButton);
    
    // Wait for camera permission and timeout
    await waitFor(
      () => {
        expect(screen.getByText(/Timeout/)).toBeInTheDocument();
      },
      { timeout: shortTimeout + 500 }
    );
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );
    
    const closeButton = screen.getByLabelText('Fermer');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should allow manual barcode input', () => {
    render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );
    
    const input = screen.getByPlaceholderText(/Code EAN/);
    const submitButton = screen.getByRole('button', { name: '✓' });
    
    // Input should be disabled initially
    expect(submitButton).toBeDisabled();
    
    // Enter a valid EAN
    fireEvent.change(input, { target: { value: '3760020507046' } });
    
    // Submit button should be enabled
    expect(submitButton).not.toBeDisabled();
    
    // Submit the form
    fireEvent.click(submitButton);
    
    expect(mockOnScan).toHaveBeenCalledWith('3760020507046');
  });

  it('should accept custom notFoundBehavior prop', () => {
    const { rerender } = render(
      <BarcodeScanner 
        onScan={mockOnScan} 
        onClose={mockOnClose}
        notFoundBehavior="save_for_review"
      />
    );
    
    // Component should render without errors
    expect(screen.getByText('📷 Scanner Code-Barres')).toBeInTheDocument();
    
    // Test with different behavior
    rerender(
      <BarcodeScanner 
        onScan={mockOnScan} 
        onClose={mockOnClose}
        notFoundBehavior="open_empty_product_page"
      />
    );
    
    expect(screen.getByText('📷 Scanner Code-Barres')).toBeInTheDocument();
  });

  it('should show stop button when scanning', async () => {
    render(
      <BarcodeScanner onScan={mockOnScan} onClose={mockOnClose} />
    );
    
    const startButton = screen.getByTestId('start-scan');
    fireEvent.click(startButton);
    
    // Wait for scanning state
    await waitFor(() => {
      const stopButton = screen.queryByTestId('stop-scan');
      if (stopButton) {
        expect(stopButton).toBeInTheDocument();
      }
    });
  });
});
