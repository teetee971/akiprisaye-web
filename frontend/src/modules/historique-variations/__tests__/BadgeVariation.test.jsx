import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { BadgeVariation } from '../BadgeVariation';

describe('BadgeVariation', () => {
  it('renders variation value correctly', () => {
    render(<BadgeVariation value={15.5} />);
    expect(screen.getByText('+15.5%')).toBeDefined();
  });

  it('displays "Stable" for variations < 10%', () => {
    render(<BadgeVariation value={5} />);
    expect(screen.getByText('Stable')).toBeDefined();
  });

  it('displays "Hausse notable" for variations 10-30%', () => {
    render(<BadgeVariation value={20} />);
    expect(screen.getByText('Hausse notable')).toBeDefined();
  });

  it('displays "Hausse importante" for variations > 30%', () => {
    render(<BadgeVariation value={40} />);
    expect(screen.getByText('Hausse importante')).toBeDefined();
  });

  it('handles negative variations correctly', () => {
    render(<BadgeVariation value={-15} />);
    expect(screen.getByText('-15.0%')).toBeDefined();
  });

  it('displays correct icon for positive variation', () => {
    const { container } = render(<BadgeVariation value={15} />);
    expect(container.textContent).toContain('↗');
  });

  it('displays correct icon for negative variation', () => {
    const { container } = render(<BadgeVariation value={-15} />);
    expect(container.textContent).toContain('↘');
  });
});
