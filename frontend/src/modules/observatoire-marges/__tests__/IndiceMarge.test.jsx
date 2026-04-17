import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { IndiceMarge } from '../IndiceMarge';

describe('IndiceMarge', () => {
  it('renders differential value correctly', () => {
    render(<IndiceMarge value={25.5} />);
    expect(screen.getByText('+25.5%')).toBeDefined();
  });

  it('displays "Faible" for values < 20%', () => {
    render(<IndiceMarge value={15} />);
    expect(screen.getByText('Faible')).toBeDefined();
  });

  it('displays "Modéré" for values 20-50%', () => {
    render(<IndiceMarge value={35} />);
    expect(screen.getByText('Modéré')).toBeDefined();
  });

  it('displays "Élevé" for values > 50%', () => {
    render(<IndiceMarge value={60} />);
    expect(screen.getByText('Élevé')).toBeDefined();
  });

  it('displays correct icon for low differential', () => {
    const { container } = render(<IndiceMarge value={10} />);
    expect(container.textContent).toContain('🟢');
  });

  it('displays correct icon for moderate differential', () => {
    const { container } = render(<IndiceMarge value={30} />);
    expect(container.textContent).toContain('🟡');
  });

  it('displays correct icon for high differential', () => {
    const { container } = render(<IndiceMarge value={55} />);
    expect(container.textContent).toContain('🔴');
  });
});
