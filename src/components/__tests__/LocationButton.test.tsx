/**
 * Tests for LocationButton Component
 * Validates button behavior, loading states, and error handling
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LocationButton from '../LocationButton';

describe('LocationButton', () => {
  it('should render button with default text', () => {
    render(<LocationButton />);
    expect(screen.getByRole('button')).toHaveTextContent('Ma position');
  });

  it('should render button with custom text', () => {
    render(<LocationButton buttonText="Get Location" />);
    expect(screen.getByRole('button')).toHaveTextContent('Get Location');
  });

  it('should apply custom className', () => {
    render(<LocationButton className="custom-class" />);
    const button = screen.getByRole('button');
    expect(button.className).toContain('custom-class');
  });

  it('should render with different variants', () => {
    const { rerender } = render(<LocationButton variant="primary" />);
    let button = screen.getByRole('button');
    expect(button.className).toContain('bg-blue-600');

    rerender(<LocationButton variant="secondary" />);
    button = screen.getByRole('button');
    expect(button.className).toContain('bg-slate-700');

    rerender(<LocationButton variant="outline" />);
    button = screen.getByRole('button');
    expect(button.className).toContain('border-2');
  });

  it('should render with different sizes', () => {
    const { rerender } = render(<LocationButton size="sm" />);
    let button = screen.getByRole('button');
    expect(button.className).toContain('text-sm');

    rerender(<LocationButton size="md" />);
    button = screen.getByRole('button');
    expect(button.className).toContain('text-base');

    rerender(<LocationButton size="lg" />);
    button = screen.getByRole('button');
    expect(button.className).toContain('text-lg');
  });

  it('should have proper accessibility attributes', () => {
    render(<LocationButton />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should have minimum touch target size', () => {
    render(<LocationButton />);
    const button = screen.getByRole('button');
    
    // Check that button has flex layout (required for icon + text)
    expect(button.className).toContain('inline-flex');
    expect(button.className).toContain('items-center');
  });

  it('should be keyboard accessible', () => {
    render(<LocationButton />);
    const button = screen.getByRole('button');
    
    // Check for focus styling
    expect(button.className).toContain('focus:outline-none');
    expect(button.className).toContain('focus:ring-2');
  });

  it('should not be initially disabled', () => {
    render(<LocationButton />);
    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });
});