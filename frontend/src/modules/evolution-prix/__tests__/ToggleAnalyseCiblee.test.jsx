import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
// eslint-disable-next-line no-unused-vars -- Component is used in render() call below
import { ToggleAnalyseCiblee } from '../ToggleAnalyseCiblee';

describe('ToggleAnalyseCiblee', () => {
  it('renders with default inactive state', () => {
    const mockToggle = () => {};
    render(<ToggleAnalyseCiblee enabled={false} onToggle={mockToggle} />);
    
    expect(screen.getByRole('heading', { name: /mode analyse ciblée/i })).toBeInTheDocument();
    expect(screen.getByText(/inactif/i)).toBeInTheDocument();
  });

  it('shows active state when enabled', () => {
    const mockToggle = () => {};
    render(<ToggleAnalyseCiblee enabled={true} onToggle={mockToggle} />);
    
    expect(screen.getByText(/actif/i)).toBeInTheDocument();
    expect(screen.getByText(/mode exploratoire/i)).toBeInTheDocument();
  });

  it('displays legal warning when active', () => {
    const mockToggle = () => {};
    render(<ToggleAnalyseCiblee enabled={true} onToggle={mockToggle} />);
    
    expect(screen.getByText(/observations citoyennes ponctuelles/i)).toBeInTheDocument();
  });

  it('displays default mode notice when inactive', () => {
    const mockToggle = () => {};
    render(<ToggleAnalyseCiblee enabled={false} onToggle={mockToggle} />);
    
    expect(screen.getByText(/mode par défaut/i)).toBeInTheDocument();
    expect(screen.getByText(/vue agrégée/i)).toBeInTheDocument();
  });

  it('calls onToggle when button is clicked', () => {
    let toggled = false;
    const mockToggle = (value) => { toggled = value; };
    
    render(<ToggleAnalyseCiblee enabled={false} onToggle={mockToggle} />);
    
    const button = screen.getByRole('switch');
    fireEvent.click(button);
    
    expect(toggled).toBe(true);
  });
});
